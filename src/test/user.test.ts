import { UserModel } from '@/models/user.model';
import { UserService } from '@/services/user.service';
import { VoteModel } from '@/models/vote.model';

jest.mock('@/models/user.model');
jest.mock('@/models/vote.model');

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  it('should return users with vote counts and averages', async () => {
    const users = [
      { _id: 'userId1', username: 'user1' },
      { _id: 'userId2', username: 'user2' },
    ];
    const votes = [
      { userId: 'userId1', score: 5 },
      { userId: 'userId1', score: 4 },
      { userId: 'userId2', score: 3 },
    ];

    (UserModel.find as jest.Mock).mockResolvedValue(users);
    (VoteModel.find as jest.Mock).mockResolvedValue(votes);

    const result = await service.getUsers();
    expect(result).toEqual([
      { username: 'user1', countVote: 2, avgVote: 4.5 },
      { username: 'user2', countVote: 1, avgVote: 3 },
    ]);
  });

  it('should delete a user by id', async () => {
    const userId = 'testUserId';
    const user = { _id: userId, username: 'testUser' };

    (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(user);
    (VoteModel.deleteMany as jest.Mock).mockResolvedValue({});

    await expect(service.deleteUser(userId)).resolves.not.toThrow();
  });

  it('should throw an error if user to delete does not exist', async () => {
    const userId = 'testUserId';

    (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    await expect(service.deleteUser(userId)).rejects.toThrow("User doesn't exist");
  });
});
