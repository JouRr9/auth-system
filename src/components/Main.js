import React from "react";
import useCheckSession from "./useCheckSession";

const Main = () => {
  const { isLoggedIn, user } = useCheckSession();

  function handleLogout() {
    fetch("http://localhost:3001/logout", {
      method: "POST",
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          window.location.reload();
        } else {
          throw new Error("Logout failed");
        }
      })
      .catch((error) => {
        console.error("Error during logout:", error);
      });
  }

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <button onClick={handleLogout}>로그아웃</button>
          <div>{user.nickname}님 환영합니다.</div>
        </div>
      ) : (
        <button
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          로그인
        </button>
      )}
    </div>
  );
};
export default Main;
