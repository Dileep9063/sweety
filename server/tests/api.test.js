const request = require('supertest');
const app = require('../src/app');
const { pool, setupDb, resetDb, daysAgo } = require('./helpers');

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(() => pool.end());

async function registerUser(email = 'asha@test.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Asha', email, password: 'password123' });
  return res.body.token;
}

const add = (token, body) =>
  request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send(body);

describe('auth', () => {
  test('register stores a hashed password, then login works', async () => {
    await registerUser();
    const { rows } = await pool.query('SELECT password_hash FROM users');
    expect(rows[0].password_hash).not.toBe('password123');
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);

    const res = await request(app)
      .post('/api/auth/login').send({ email: 'asha@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('duplicate email and wrong password are rejected', async () => {
    await registerUser();
    const dup = await request(app)
      .post('/api/auth/register').send({ name: 'X', email: 'asha@test.com', password: 'password123' });
    expect(dup.status).toBe(409);

    const bad = await request(app)
      .post('/api/auth/login').send({ email: 'asha@test.com', password: 'wrong-pass' });
    expect(bad.status).toBe(401);
  });

  test('readings need a token', async () => {
    const res = await request(app).get('/api/readings');
    expect(res.status).toBe(401);
  });
});

describe('readings rules', () => {
  const date = daysAgo(1);

  test('creates a reading', async () => {
    const token = await registerUser();
    const res = await add(token, { date, slot: 'morning', value: 110 });
    expect(res.status).toBe(201);
    expect(res.body.reading).toMatchObject({ date, slot: 'morning', value: 110 });
  });

  test('rejects duplicate slot on the same day', async () => {
    const token = await registerUser();
    await add(token, { date, slot: 'after_lunch', value: 140 });
    const res = await add(token, { date, slot: 'after_lunch', value: 150 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('rejects a 5th reading on the same day', async () => {
    const token = await registerUser();
    for (const slot of ['morning', 'after_breakfast', 'after_lunch', 'after_dinner']) {
      expect((await add(token, { date, slot, value: 120 })).status).toBe(201);
    }
    const res = await add(token, { date, slot: 'morning', value: 120 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You can add only 4 readings per day.');
  });

  test('editing only the value does not trigger the duplicate-slot error', async () => {
    const token = await registerUser();
    const created = await add(token, { date, slot: 'after_lunch', value: 140 });
    const res = await request(app)
      .put(`/api/readings/${created.body.reading.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date, slot: 'after_lunch', value: 160 });
    expect(res.status).toBe(200);
    expect(res.body.reading.value).toBe(160);
  });

  test('a user cannot see, edit or delete another user\'s readings', async () => {
    const a = await registerUser('a@test.com');
    const b = await registerUser('b@test.com');
    const created = await add(a, { date, slot: 'morning', value: 100 });
    const id = created.body.reading.id;

    const list = await request(app).get('/api/readings').set('Authorization', `Bearer ${b}`);
    expect(list.body.readings).toHaveLength(0);

    const put = await request(app).put(`/api/readings/${id}`)
      .set('Authorization', `Bearer ${b}`).send({ date, slot: 'morning', value: 200 });
    expect(put.status).toBe(404);

    const del = await request(app).delete(`/api/readings/${id}`).set('Authorization', `Bearer ${b}`);
    expect(del.status).toBe(404);
  });

  test('deletes a reading', async () => {
    const token = await registerUser();
    const created = await add(token, { date, slot: 'morning', value: 100 });
    const del = await request(app)
      .delete(`/api/readings/${created.body.reading.id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);
  });
});

describe('reports', () => {
  test('daily, month-to-date and previous month', async () => {
    const token = await registerUser();
    await add(token, { date: '2026-03-15', slot: 'morning', value: 100 });
    await add(token, { date: '2026-03-01', slot: 'morning', value: 200 });
    await add(token, { date: '2026-02-10', slot: 'morning', value: 300 });
    await add(token, { date: '2026-02-28', slot: 'morning', value: 150 });

    const res = await request(app)
      .get('/api/reports?date=2026-03-15').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    expect(res.body.daily.stats).toEqual({ count: 1, highest: 100, lowest: 100, average: 100 });
    expect(res.body.daily.readings).toHaveLength(1);
    expect(res.body.monthToDate.range).toEqual({ from: '2026-03-01', to: '2026-03-15' });
    expect(res.body.monthToDate.stats).toEqual({ count: 2, highest: 200, lowest: 100, average: 150 });
    expect(res.body.previousMonth.range).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(res.body.previousMonth.stats).toEqual({ count: 2, highest: 300, lowest: 150, average: 225 });
  });

  test('average is rounded to 1 decimal', async () => {
    const token = await registerUser();
    await add(token, { date: '2026-03-15', slot: 'morning', value: 100 });
    await add(token, { date: '2026-03-15', slot: 'after_lunch', value: 101 });
    await add(token, { date: '2026-03-15', slot: 'after_dinner', value: 101 });
    const res = await request(app)
      .get('/api/reports?date=2026-03-15').set('Authorization', `Bearer ${token}`);
    expect(res.body.daily.stats.average).toBe(100.7);
  });

  test('empty report returns count 0 and null stats', async () => {
    const token = await registerUser();
    const res = await request(app)
      .get('/api/reports?date=2026-03-15').set('Authorization', `Bearer ${token}`);
    expect(res.body.daily.stats).toEqual({ count: 0, highest: null, lowest: null, average: null });
  });

  test('future date is rejected', async () => {
    const token = await registerUser();
    const res = await request(app)
      .get(`/api/reports?date=${daysAgo(-3)}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Date cannot be in the future.');
  });
});
