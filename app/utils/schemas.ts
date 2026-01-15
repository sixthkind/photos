async function getSchema(type: string) {
  let schema = schemas[type];

  if(type === 'items' || type === 'clients' || type === 'photos') {
    let tags = await getTags();
    schema.tags.items = tags;
  }

  return schema;
}

async function getTags() {
  const tags = await pb.collection('tags').getFullList();
  return tags.map(tag => ({
    value: tag.id,
    label: tag.name
  }));
}

const schemas: any = {
  users: {
    name: { type: "text", label: "Name" },
    avatar: { type: "file", label: "Avatar", drop: true, "upload-temp-endpoint": false, "soft-remove": true }
  },
  items: {
    name: { type: "text", label: "Name" },
    tags: { type: "tags", label: "Tags", items: [] },
    content: { type: "editor", label: "Content" },
    files: { type: "multifile", label: "Files", "upload-temp-endpoint": false, "soft-remove": true, "upload-button": false }
  },
  tags: {
    name: { type: "text", label: "Name" }
  },
  clients: {
    name: { type: "text", label: "Name" },
    tags: { type: "tags", label: "Permission", items: [] }
  },
  photos: {
    title: { type: "text", label: "Title" },
    description: { type: "textarea", label: "Description" },
    photo: { type: "file", label: "Photo", accept: "image/*", "upload-temp-endpoint": false, "soft-remove": true },
    tags: { type: "tags", label: "Tags", items: [] },
    user: { type: "hidden" }
  },
  notdeletable: ['users']
}

export { getSchema };