const userDB = [
  { username: 'Lili', from: 'USA', password: '123', id: '1' },
  { username: 'Jack', from: 'Chinese', password: '123', id: '2' },
];

export function login(username, password) {
  return new Promise((res) => {
    setTimeout(() => {
      const result = userDB.find(user => user.username.toLowerCase() === username.toLowerCase() && user.password === password);
      if (result) {
        res({ success: true, id: result.id });
      } else {
        res({ success: false, message: 'login error' });
      }
    }, 1000);
  });
}

export function fetchUserInfo(id) {
  return userDB.find(user => user.id === id);
}
