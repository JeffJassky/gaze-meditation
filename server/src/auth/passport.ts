import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User, type UserDoc } from '../models/User.js';

export function configurePassport(): void {
  passport.use(
    new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
      try {
        const user = await User.findOne({ username: username.trim() });
        if (!user) return done(null, false, { message: 'invalid_credentials' });
        const ok = await user.verifyPassword(password);
        if (!ok) return done(null, false, { message: 'invalid_credentials' });
        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as UserDoc).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || false);
    } catch (err) {
      done(err as Error);
    }
  });
}
