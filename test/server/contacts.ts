import { expect } from 'chai';
import { agent } from 'supertest';
import server from './fake-server';
import { newUser } from './fake-user';

describe('Contacts', () => {
  describe('Lookup', () => {
    it('should reject unauthenticated queries', async () => {
      const app = agent(await server());
      await newUser(app, 'user1');
      await app.get('/api/2/contacts/lookup/user1')
          .expect(500);
    });

    it('should return empty for no matching user', async () => {
      const app = agent(await server());
      const user = await newUser(app, 'user1');
      await user.get('/api/2/contacts/lookup/invalid')
          .expect(200)
          .expect((res: any) => expect(res.body).to.be.empty);
    });

    it('should allow self lookups', async () => {
      const app = agent(await server());
      const user = await newUser(app, 'user1');
      await user.get('/api/2/contacts/lookup/user1')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            user: {
              display_name: 'user1',
              id: 1,
            },
          }));
    });

    it('should allow other user lookups', async () => {
      const app = agent(await server());
      const user1 = await newUser(app, 'user1');
      await newUser(app, 'user2');
      await user1.get('/api/2/contacts/lookup/user2')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            user: {
              display_name: 'user2',
              id: 2,
            },
          }));
    });
  });

  describe('Contact Lists', () => {
    it('should be empty by default', async () => {
      const app = agent(await server());
      const user1 = await newUser(app, 'user1');
      await newUser(app, 'user2');
      await user1.get('/api/2/contacts')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            contacts: [],
          }));
    });

    it('should allow contacts to be added', async () => {
      const app = agent(await server());
      const user1 = await newUser(app, 'user1');
      await newUser(app, 'user2');
      await user1.put('/api/2/contacts/2').expect(200);
      await user1.get('/api/2/contacts')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            contacts: [{
              display_name: 'user2',
              id: 2,
            }],
          }));
    });
  });

  describe('Contact Groups', () => {
    it('should allow querying empty groups', async () => {
      const app = agent(await server());
      const user1 = await newUser(app, 'user1');
      await newUser(app, 'user2');
      await user1.get('/api/2/contacts/group')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            contact_groups: [],
          }));
    });

    it('should allow groups to be created', async () => {
      const app = agent(await server());
      const user1 = await newUser(app, 'user1');
      await newUser(app, 'user2');
      await user1.post('/api/2/contacts/group')
          .send({contact_group: {name: 'group name'}})
          .expect(200);
      await user1.get('/api/2/contacts/group')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            contact_groups: [{
              id: 1,
              members: [],
              name: 'group name',
            }],
          }));
    });

    it('should allow groups to have members added', async () => {
      const app = agent(await server());
      const user1 = await newUser(app, 'user1');
      await newUser(app, 'user2');
      await user1.post('/api/2/contacts/group')
          .send({contact_group: {name: 'group name'}})
          .expect(200);
      await user1.put('/api/2/contacts/group/1/2').expect(200);
      await user1.get('/api/2/contacts/group')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            contact_groups: [{
              id: 1,
              members: [{
                display_name: 'user2',
                id: 2,
              }],
              name: 'group name',
            }],
          }));
    });

    it('should allow groups to have members removed', async () => {
      const app = agent(await server());
      const user1 = await newUser(app, 'user1');
      await newUser(app, 'user2');
      await newUser(app, 'user3');
      await user1.post('/api/2/contacts/group')
          .send({contact_group: {name: 'group name'}})
          .expect(200);
      await user1.put('/api/2/contacts/group/1/2').expect(200);
      await user1.put('/api/2/contacts/group/1/3').expect(200);
      await user1.get('/api/2/contacts/group')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            contact_groups: [{
              id: 1,
              members: [
                {
                  display_name: 'user2',
                  id: 2,
                }, {
                  display_name: 'user3',
                  id: 3,
                },
              ],
              name: 'group name',
            }],
          }));
      await user1.delete('/api/2/contacts/group/1/2').expect(200);
      await user1.get('/api/2/contacts/group')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            contact_groups: [{
              id: 1,
              members: [{
                display_name: 'user3',
                id: 3,
              }],
              name: 'group name',
            }],
          }));
    });

    it("should not allow other groups edit other's groups", async () => {
      const app = agent(await server());
      const user1 = await newUser(app, 'user1');
      const user2 = await newUser(app, 'user2');
      await user1.post('/api/2/contacts/group')
          .send({contact_group: {name: 'group name'}})
          .expect(200);
      await user2.put('/api/2/contacts/group/1/2').expect(500);
      await user1.get('/api/2/contacts/group')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            contact_groups: [{
              id: 1,
              members: [],
              name: 'group name',
            }],
          }));
    });

    it('should allow complex groups', async () => {
      const app = agent(await server());
      const user1 = await newUser(app, 'user1');
      await newUser(app, 'user2');
      await newUser(app, 'user3');
      await newUser(app, 'user4');
      await newUser(app, 'user5');
      await user1.post('/api/2/contacts/group')
          .send({contact_group: {name: 'group 1'}})
          .expect(200);
      await user1.post('/api/2/contacts/group')
          .send({contact_group: {name: 'group 2'}})
          .expect(200);
      await user1.put('/api/2/contacts/group/1/4').expect(200);
      await user1.put('/api/2/contacts/group/1/3').expect(200);
      await user1.put('/api/2/contacts/group/1/2').expect(200);
      await user1.put('/api/2/contacts/group/2/5').expect(200);
      await user1.put('/api/2/contacts/group/2/4').expect(200);
      await user1.get('/api/2/contacts/group')
          .expect(200)
          .expect((res: any) => expect(res.body).to.deep.equal({
            contact_groups: [
              {
                id: 1,
                members: [
                  {display_name: 'user2', id: 2},
                  {display_name: 'user3', id: 3},
                  {display_name: 'user4', id: 4},
                ],
                name: 'group 1',
              }, {
                id: 2,
                members: [
                  {display_name: 'user4', id: 4},
                  {display_name: 'user5', id: 5},
                ],
                name: 'group 2',
              },
            ],
          }));
    });
  });
});
