import { create } from 'zustand';

const DEFAULT_DBML = `// Welcome to ERD Studio!
// Type your DBML code here and see the diagram on the right.

Table users {
  id integer [pk, increment]
  username varchar(255) [not null, unique]
  email varchar(255) [not null, unique]
  password_hash varchar(255) [not null]
  role varchar(50) [default: 'user']
  created_at timestamp [default: \`now()\`]
  updated_at timestamp
}

Table profiles {
  id integer [pk, increment]
  user_id integer [not null, unique]
  display_name varchar(100)
  bio text
  avatar_url varchar(500)
}

Table posts {
  id integer [pk, increment]
  title varchar(255) [not null]
  body text
  status varchar(20) [default: 'draft']
  user_id integer [not null]
  category_id integer
  created_at timestamp [default: \`now()\`]
  updated_at timestamp
}

Table comments {
  id integer [pk, increment]
  content text [not null]
  user_id integer [not null]
  post_id integer [not null]
  parent_id integer
  created_at timestamp [default: \`now()\`]
}

Table categories {
  id integer [pk, increment]
  name varchar(100) [not null, unique]
  slug varchar(100) [not null, unique]
  description text
}

Table tags {
  id integer [pk, increment]
  name varchar(100) [not null, unique]
}

Table post_tags {
  post_id integer [not null]
  tag_id integer [not null]

  indexes {
    (post_id, tag_id) [pk]
  }
}

Table likes {
  id integer [pk, increment]
  user_id integer [not null]
  post_id integer [not null]
  created_at timestamp [default: \`now()\`]

  indexes {
    (user_id, post_id) [unique]
  }
}

Table notifications {
  id integer [pk, increment]
  user_id integer [not null]
  type varchar(50) [not null]
  message text [not null]
  is_read boolean [default: false]
  created_at timestamp [default: \`now()\`]
}

// ─── Relationships ───

Ref: profiles.user_id > users.id
Ref: posts.user_id > users.id
Ref: posts.category_id > categories.id
Ref: comments.user_id > users.id
Ref: comments.post_id > posts.id
Ref: comments.parent_id > comments.id
Ref: post_tags.post_id > posts.id
Ref: post_tags.tag_id > tags.id
Ref: likes.user_id > users.id
Ref: likes.post_id > posts.id
Ref: notifications.user_id > users.id

// ─── Table Groups ───

TableGroup UserSystem {
  users
  profiles
  notifications
}

TableGroup Content {
  posts
  comments
  categories
}

TableGroup Taxonomy {
  tags
  post_tags
}

TableGroup Engagement {
  likes
}
`;

interface EditorState {
  dbmlText: string;
  setDbmlText: (text: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  dbmlText: localStorage.getItem('erd-studio-dbml') ?? DEFAULT_DBML,
  setDbmlText: (text: string) => {
    localStorage.setItem('erd-studio-dbml', text);
    set({ dbmlText: text });
  },
}));
