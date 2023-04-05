import UsersRepository from "../repositories/UserRepository";

class UserService {
  userRepository: UsersRepository;

  constructor({ userRepository }: { userRepository: UsersRepository }) {
    this.userRepository = userRepository;
  }
}

export default UserService;
