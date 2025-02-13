export const privateRequest = async (url: string, token: string, options: RequestInit = {}) => {
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
};