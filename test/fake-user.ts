import { SuperTest, Test } from 'supertest';

export default class FakeUser {
  private app: SuperTest<Test>;
  private token: string;

  constructor(app: SuperTest<Test>, token: string) {
    this.app = app;
    this.token = token;
  }

  get(path: string): Test {
    return this.app.get(path).set('x-pifuxelck-auth', this.token);
  }

  post(path: string): Test {
    return this.app.post(path).set('x-pifuxelck-auth', this.token);
  }
}

export async function newUser(
    app: SuperTest<Test>, 
    user: string, 
    password = '12345678'): Promise<FakeUser> {
  const token = await app.post('/api/2/account/register')
      .send({display_name: user, password})
      .expect(200)
      .then((response: any) => response.body.auth);
  return new FakeUser(app, token);
}
