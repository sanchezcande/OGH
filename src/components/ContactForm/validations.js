export const validateName = (name) => {
  return name && name.length > 2;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateMessage = (message) => {
  return message && message.length > 10;
};
