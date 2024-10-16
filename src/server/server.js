const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");
const { Pool } = require("pg");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);

const app = express();
const port = 3001;

// PostgreSQL 연결 설정
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "5432", // 실제 비밀번호로 대체
  port: 5432,
});

// CORS 미들웨어 사용
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// JSON 요청 본문을 처리할 수 있도록 미들웨어 추가
app.use(express.json());

// 세션 설정
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "session",
    }),
    secret: "vp",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 365 * 24 * 60 * 60 * 1000 },
  })
);

// Passport 초기화 및 세션 사용
app.use(passport.initialize());
app.use(passport.session());

// bcrypt
const saltRounds = 10;

// Passport 설정 - Google OAuth2
passport.use(
  new GoogleStrategy(
    {
      clientID: "",
      clientSecret: "",
      callbackURL: "http://localhost:3001/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 구글 프로필 정보를 기반으로 사용자를 찾거나 생성
        let user = await pool.query("SELECT * FROM users WHERE email = $1", [
          profile.emails[0].value,
        ]);

        // 이미 계정이 있으면 패스
        if (!user.rows[0]) {
          // 닉네임 길이 제한, 6자리 남기고 자르기
          let byteSize = 0;
          let nickname = "";

          for (let i = 0; i < profile.displayName.length; i++) {
            const char = profile.displayName.charAt(i);

            // 한글인지 확인, 한글이면 2바이트 (유니코드 범위로 확인)
            if (char.charCodeAt(0) >= 0xac00 && char.charCodeAt(0) <= 0xd7a3) {
              byteSize += 2;
            } else {
              byteSize += 1;
            }
            // 중복일 때 붙일 숫자 자리까지 남겨놓게 8
            if (byteSize > 8) {
              break;
            } else {
              nickname += char;
            }
          }

          // 구글 닉네임은 중복 가능이라 중복확인하고 닉넴 뒤에 번호 붙이기
          let count = 1;
          let newNickname = nickname;
          while (true) {
            const nicknameCheck = await pool.query(
              "SELECT * FROM users WHERE nickname = $1",
              [newNickname]
            );
            if (!nicknameCheck.rows[0]) {
              break;
            }
            newNickname = `${nickname}_${count}`;
            count++;
          }
          // 사용자가 없으면 생성
          const newUser = await pool.query(
            "INSERT INTO users (email, nickname, is_social) VALUES ($1, $2, $3)",
            [profile.emails[0].value, newNickname, true]
          );
          user = newUser;
        }

        done(null, user.rows[0]);
      } catch (err) {
        console.error(err.message);
        done(err, null);
      }
    }
  )
);
// Passport 직렬화 및 역직렬화
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// 로그인 상태 확인
app.get("/check-session", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// 회원가입
app.post("/signup", async (req, res) => {
  const { email, nickname, password } = req.body;
  try {
    // 암호화
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      "INSERT INTO users (email, nickname, password) VALUES ($1, $2, $3)",
      [email, nickname, hashedPassword]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});
// 아이디 중복 확인
app.post("/check-email", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      return res.json({ available: false });
    }
    return res.json({ available: true });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// 닉네임 중복 확인
app.post("/check-nickname", async (req, res) => {
  const { nickname } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE nickname = $1", [
      nickname,
    ]);
    if (result.rows.length > 0) {
      return res.json({ available: false });
    }
    return res.json({ available: true });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// 로그인
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 비밀번호 매칭
    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    req.login(user.rows[0], (err) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      return res.json({ message: "Login successful" });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});
// 로그아웃
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    // 세션 쿠키를 삭제
    res.clearCookie("connect.sid");
    // 서버 측 세션 데이터 삭제
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to destroy session" });
      }
      res.json({ message: "Logout successful" });
    });
  });
});

// 구글 소셜 로그인
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("http://localhost:3000");
  }
);

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
