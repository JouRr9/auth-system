import { useState, useEffect } from "react";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailAvailable, setIsEmailAvailable] = useState(null);
  const [isEmailCheckAvailable, setIsEmailCheckAvailable] = useState(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(null);
  const [isNicknameCheckAvailable, setIsNicknameCheckAvailable] =
    useState(false);
  const [isPasswordAvailable, setIsPasswordAvailable] = useState(null);

  // 이메일 형식 확인 (간단한 정규식 사용)
  useEffect(() => {
    setIsEmailCheckAvailable(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    setIsEmailAvailable(null);
  }, [email]);

  // 닉네임 제한 설정
  useEffect(() => {
    let byteSize = 0;

    for (let i = 0; i < nickname.length; i++) {
      const char = nickname.charAt(i);
      // 한글인지 확인 (유니코드 범위로 확인)
      if (char.charCodeAt(0) >= 0xac00 && char.charCodeAt(0) <= 0xd7a3) {
        byteSize += 2;
      } else {
        byteSize += 1;
      }
    }
    // 길이 제한과 완성되지 않은 한글 제한
    if (byteSize >= 4 && byteSize <= 12 && !/[ㄱ-ㅎㅏ-ㅣ]/.test(nickname)) {
      setIsNicknameCheckAvailable(true);
    } else setIsNicknameCheckAvailable(false);
    setIsNicknameAvailable(null);
  }, [nickname]);

  useEffect(() => {
    if (password.length === 0) setIsPasswordAvailable(null);
    else if (password.length < 6) setIsPasswordAvailable(false);
    else setIsPasswordAvailable(true);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, nickname, password }),
        credentials: "include", // 세션 쿠키 포함
      });

      const data = await response.json();
      console.log("Signup successful:", data);

      window.location.href = "/login";
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  // 이메일 중복 확인
  const handelCheckEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setIsEmailAvailable(data.available);
      console.log(1);
    } catch (error) {
      console.error("Error checking username:", error);
    }
  };

  // 닉네임 중복 확인
  const handelCheckNickname = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/check-nickname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname }),
      });

      const data = await response.json();
      setIsNicknameAvailable(data.available);
    } catch (error) {
      console.error("Error checking nickname:", error);
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <h2>회원가입</h2>
        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <input
              style={
                isEmailAvailable === true
                  ? { border: "1px solid green" }
                  : isEmailAvailable === false
                  ? { border: "1px solid red" }
                  : {}
              }
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              required
            />
            <button
              className="signup-button"
              onClick={handelCheckEmail}
              disabled={!isEmailCheckAvailable}
            >
              중복 확인
            </button>
            {/* {isEmailAvailable === false && (
              <div>이미 사용 중인 이메일입니다.</div>
            )}
            {isEmailAvailable === true && <div>사용 가능한 이메일입니다.</div>} */}
          </div>
          <div className="login-input-group">
            <input
              style={
                isNicknameAvailable === true
                  ? { border: "1px solid green" }
                  : isNicknameAvailable === false
                  ? { border: "1px solid red" }
                  : {}
              }
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
              required
            />
            <button
              className="signup-button"
              onClick={handelCheckNickname}
              disabled={!isNicknameCheckAvailable}
            >
              중복 확인
            </button>
            {/* {isNicknameAvailable === false && (
              <div>이미 사용 중인 닉네임입니다.</div>
            )}
            {isNicknameAvailable === true && (
              <div>사용 가능한 닉네임입니다.</div>
            )} */}
          </div>
          <div className="login-input-group">
            <input
              style={
                isPasswordAvailable === true
                  ? { border: "1px solid green" }
                  : isPasswordAvailable === false
                  ? { border: "1px solid red" }
                  : {}
              }
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              required
            />
            {isPasswordAvailable === false ? (
              <div>6자 이상 입력해주세요</div>
            ) : isPasswordAvailable === true ? (
              <div>사용 가능한 비밀번호입니다.</div>
            ) : (
              <div>&nbsp;</div>
            )}
            {/* {isPasswordAvailable === false && <div>6자 이상 입력해주세요</div>}
            {isPasswordAvailable === true && (
              <div>사용 가능한 비밀번호입니다.</div>
            )} */}
          </div>
          <button
            className="login-button"
            type="submit"
            disabled={
              !isNicknameAvailable || !isEmailAvailable || !isPasswordAvailable
            }
          >
            가입
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
