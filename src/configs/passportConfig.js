const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const AuthService = require("../services/websiteServices/authService");

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const { email, sub: googleId, picture } = profile._json;
        console.log(profile, "profile");
        console.log(googleId, "googleId");

        if (!googleId) {
          const record = {
            success: false,
            msg: msg.GoogleIDSsubIsMissing,
            key: 1,
          };
          return res.status(200).json(record);
        }

        const { user } = await AuthService.loginOrCreateAccountService({
          provider: "GOOGLE",
          displayName: profile.displayName,
          providerId: googleId,
          picture: picture,
          email: email,
        });

        const jwt = jwtGenerate({
          userId: user._id,
        });
        req.jwt = jwt;

        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY,
  audience: ["user"],
  algorithms: ["HS256"],
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await AuthService.findUserByIdService(payload.userId);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Session Serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Export JWT middleware
const passportAuthenticateJWT = passport.authenticate("jwt", {
  session: false,
});

module.exports = {
  passportAuthenticateJWT,
};
