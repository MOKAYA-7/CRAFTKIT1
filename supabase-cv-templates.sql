-- Seed the ten CRAFTKIT CV templates into the existing products table.
-- Safe to run more than once; titles are unique and duplicates are ignored.
-- The image paths resolve from the GitHub Pages project root.

insert into public.products (tag, title, description, image, price, editable, is_active)
values
  ('CV', 'CV Template 01 · Executive Navy', 'A refined two-column CV with a strong professional profile and clear experience timeline.', 'assets/cv1.png', 10, true, true),
  ('CV', 'CV Template 02 · Graduate Teal', 'A fresh graduate layout designed to bring education, internships, and early-career skills forward.', 'assets/cv2.png', 10, true, true),
  ('CV', 'CV Template 03 · Modern Monochrome', 'A high-contrast editorial CV with room for a concise profile and detailed work history.', 'assets/cv3.png', 10, true, true),
  ('CV', 'CV Template 04 · Gold Accent', 'A bold, structured layout for marketing, management, and client-facing careers.', 'assets/cv4.png', 10, true, true),
  ('CV', 'CV Template 05 · Teal Creative', 'A creative CV design with clear sections for education, projects, and visual skills.', 'assets/cv5.png', 10, true, true),
  ('CV', 'CV Template 06 · Royal Blue', 'A confident blue layout for technical specialists and experienced professionals.', 'assets/cv6.png', 10, true, true),
  ('CV', 'CV Template 07 · Forest Editorial', 'A premium editorial look with balanced profile, education, and career sections.', 'assets/cv7.png', 10, true, true),
  ('CV', 'CV Template 08 · Minimal Teal', 'A clean contemporary CV focused on readable content and a strong visual hierarchy.', 'assets/cv8.png', 10, true, true),
  ('CV', 'CV Template 09 · Warm Minimal', 'An understated warm-toned design for creative and professional roles.', 'assets/cv9.png', 10, true, true),
  ('CV', 'CV Template 10 · Classic Blue', 'A polished classic layout with strong contrast and practical section spacing.', 'assets/cv10.png', 10, true, true)
on conflict (title) do update set
  tag = excluded.tag,
  description = excluded.description,
  image = excluded.image,
  price = excluded.price,
  editable = excluded.editable,
  is_active = excluded.is_active;

update public.products
set is_active = false
where title = 'Executive Resume Kit';
