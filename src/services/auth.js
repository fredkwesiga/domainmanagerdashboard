// Static auth service
export const login = async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@example.com' && password === 'password') {
          resolve({ success: true });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  };
  
  export const logout = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 200);
    });
  };