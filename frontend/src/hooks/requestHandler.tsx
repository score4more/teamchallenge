import {getGlobalLogout} from "../context/AuthContext.js";

export const privateRequest = async (url: string, token: string, options: RequestInit = {}) => {
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers }).then((response) => {
    if (response.status === 401) {
      const logout = getGlobalLogout();
      if (logout) logout();
      throw new Error("Unauthorized. Logging out...");
    }
    return response;
  });
};