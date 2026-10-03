async function registerCraftkitAccount(name, email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: String(email || "").trim().toLowerCase(),
    password,
    options: { data: { name: String(name || "").trim() } }
  });

  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not return a new account.");
  if (!data.session) {
    throw new Error("Account created, but email confirmation is enabled. Disable Confirm email in Supabase Auth settings, then try signing in.");
  }
  localStorage.setItem("craftkitUserEmail", data.user.email);
  return { id: data.user.id, name: data.user.user_metadata?.name || name, email: data.user.email };
}

async function loginCraftkitAccount(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: String(email || "").trim().toLowerCase(),
    password
  });

  if (error) throw error;
  localStorage.setItem("craftkitUserEmail", data.user.email);
  return { id: data.user.id, name: data.user.user_metadata?.name || "", email: data.user.email };
}

async function getCraftkitAccount() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) return null;
  return { id: data.user.id, name: data.user.user_metadata?.name || "", email: data.user.email };
}
