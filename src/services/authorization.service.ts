import { getAuth } from 'firebase-admin/auth';

import { User } from '@models';
import { createJwtToken, env } from '@utils';

// need change user type
const setAuth = (userId: string, userRole: string) => {
  const authToken = createJwtToken(
    { id: userId, role: userRole },
    env.authorizationTokenDuration,
  );
  const refreshToken = createJwtToken(
    { id: userId, role: userRole },
    env.refreshTokenDuration,
  );

  return {
    access_token: authToken,
    refresh_token: refreshToken,
  };
};

const auth = async ({ idToken }: { idToken: string }) => {
  const { name, email, uid: fb_id } = await getAuth().verifyIdToken(idToken);

  const findUser = await User.findOne({
    email,
    fb_id,
  }).exec();

  if (findUser) {
    const {
      _id,
      fb_id: fbIf,
      ...user
    } = {
      ...findUser.toObject(),
      id: findUser._id,
    };

    return { user, token: setAuth(user.id, user.role) };
  }

  if (!findUser) {
    const newUser = new User({
      name,
      email,
      fb_id,
      role: 'User',
    });
    await User.create(newUser);
    const findNewUser = await User.findOne({
      email,
      fb_id,
    }).exec();

    if (findNewUser) {
      const {
        _id,
        fb_id: fbIf,
        ...user
      } = {
        ...findNewUser.toObject(),
        id: findNewUser._id,
      };

      return { user, token: setAuth(user.id, user.role) };
    }
  }
};

export default { auth };
