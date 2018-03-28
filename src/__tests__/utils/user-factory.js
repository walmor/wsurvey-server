import userRepository from '../../repositories/mongoose/user-repository';

function getRandomUser(userProps) {
  return Object.assign(
    {
      name: 'John',
      email: 'john@example.com',
      password: 'password',
      googleId: '16491654965494',
      facebookId: '5743164649619',
    },
    userProps,
  );
}

async function saveUser(userProps) {
  const user = getRandomUser(userProps);
  return userRepository.create(user);
}

export { getRandomUser, saveUser };
