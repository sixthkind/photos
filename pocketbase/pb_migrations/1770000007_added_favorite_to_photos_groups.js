/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const photos = app.findCollectionByNameOrId("pbc_1234567890")
  const groups = app.findCollectionByNameOrId("pbc_9876543210")

  if (!photos.fields.getByName("favorite")) {
    photos.fields.addAt(8, new Field({
      "hidden": false,
      "id": "bool135791116",
      "name": "favorite",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "bool"
    }))
  }

  if (!groups.fields.getByName("favorite")) {
    groups.fields.addAt(7, new Field({
      "hidden": false,
      "id": "bool135791117",
      "name": "favorite",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "bool"
    }))
  }

  app.save(photos)
  return app.save(groups)
}, (app) => {
  const photos = app.findCollectionByNameOrId("pbc_1234567890")
  const groups = app.findCollectionByNameOrId("pbc_9876543210")

  if (photos.fields.getByName("favorite")) {
    photos.fields.removeById("bool135791116")
  }

  if (groups.fields.getByName("favorite")) {
    groups.fields.removeById("bool135791117")
  }

  app.save(photos)
  return app.save(groups)
})
