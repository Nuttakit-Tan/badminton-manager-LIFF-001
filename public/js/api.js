async function apiCall(action, params = {}) {

  const query = new URLSearchParams({
    action,
    ...params
  }).toString();

  const url = CONFIG.API_URL + "?" + query;

  const res = await fetch(url);

  return await res.json();
}