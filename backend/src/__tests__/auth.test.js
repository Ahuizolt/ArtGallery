const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('registra un usuario válido y retorna 201', async () => {
    const res = await request(app).post('/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  it('retorna 409 si el email ya existe', async () => {
    await request(app).post('/auth/register').send({
      username: 'user1',
      email: 'dup@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/auth/register').send({
      username: 'user2',
      email: 'dup@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('El email ya está registrado');
  });

  it('retorna 400 si falta el email', async () => {
    const res = await request(app).post('/auth/register').send({
      username: 'testuser',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('retorna 400 si la password tiene menos de 6 caracteres', async () => {
    const res = await request(app).post('/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  it('retorna 400 si el username tiene menos de 3 caracteres', async () => {
    const res = await request(app).post('/auth/register').send({
      username: 'ab',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('almacena la password como hash bcrypt', async () => {
    await request(app).post('/auth/register').send({
      username: 'hashuser',
      email: 'hash@example.com',
      password: 'plainpassword',
    });
    const user = await User.findOne({ email: 'hash@example.com' });
    expect(user.password).toMatch(/^\$2b\$/);
    expect(user.password).not.toBe('plainpassword');
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send({
      username: 'loginuser',
      email: 'login@example.com',
      password: 'password123',
    });
  });

  it('retorna 200 con access_token y refresh_token en login exitoso', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
  });

  it('retorna 401 si el email no existe', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'noexiste@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('retorna 401 si la password es incorrecta', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('retorna 400 si el email tiene formato inválido', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/refresh', () => {
  let refreshToken;

  beforeEach(async () => {
    await request(app).post('/auth/register').send({
      username: 'refreshuser',
      email: 'refresh@example.com',
      password: 'password123',
    });
    const loginRes = await request(app).post('/auth/login').send({
      email: 'refresh@example.com',
      password: 'password123',
    });
    refreshToken = loginRes.body.refresh_token;
  });

  it('retorna 200 con nuevo access_token usando refresh_token válido', async () => {
    const res = await request(app).post('/auth/refresh').send({ refresh_token: refreshToken });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });

  it('retorna 400 si no se envía refresh_token', async () => {
    const res = await request(app).post('/auth/refresh').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Refresh token requerido');
  });

  it('retorna 401 si el refresh_token es inválido', async () => {
    const res = await request(app).post('/auth/refresh').send({ refresh_token: 'invalid.token.here' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Refresh token inválido o expirado');
  });
});

describe('GET /protected (Auth_Middleware)', () => {
  let accessToken;

  beforeEach(async () => {
    await request(app).post('/auth/register').send({
      username: 'protecteduser',
      email: 'protected@example.com',
      password: 'password123',
    });
    const loginRes = await request(app).post('/auth/login').send({
      email: 'protected@example.com',
      password: 'password123',
    });
    accessToken = loginRes.body.access_token;
  });

  it('retorna 401 si no hay header Authorization', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token no proporcionado');
  });

  it('retorna 401 si el token es inválido', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token inválido o expirado');
  });

  it('retorna 200 y adjunta userId con token válido', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('userId');
  });
});

describe('User_Model validaciones', () => {
  it('lanza error si falta el username', async () => {
    const user = new User({ email: 'test@example.com', password: 'hash' });
    await expect(user.validate()).rejects.toThrow();
  });

  it('lanza error si falta el email', async () => {
    const user = new User({ username: 'testuser', password: 'hash' });
    await expect(user.validate()).rejects.toThrow();
  });

  it('lanza error si falta la password', async () => {
    const user = new User({ username: 'testuser', email: 'test@example.com' });
    await expect(user.validate()).rejects.toThrow();
  });

  it('incluye timestamps al crear un documento', async () => {
    const user = new User({
      username: 'tsuser',
      email: 'ts@example.com',
      password: 'hashedpw',
    });
    await user.save();
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});
