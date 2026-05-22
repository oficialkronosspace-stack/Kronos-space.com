-- TABLA: perfiles de usuario
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  is_pro boolean default false,
  created_at timestamp with time zone default now()
);

-- TABLA: conteo de uso diario
create table if not exists usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  date date not null,
  count integer default 0,
  unique(user_id, date)
);

-- TABLA: historial de scripts generados
create table if not exists scripts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  mode text,
  niche text,
  topic text,
  tone text,
  result text,
  created_at timestamp with time zone default now()
);

-- Crear perfil automáticamente al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Seguridad: solo cada usuario ve sus propios datos
alter table profiles enable row level security;
alter table usage enable row level security;
alter table scripts enable row level security;

create policy "Users see own profile" on profiles for all using (auth.uid() = id);
create policy "Users see own usage"   on usage   for all using (auth.uid() = user_id);
create policy "Users see own scripts" on scripts  for all using (auth.uid() = user_id);
