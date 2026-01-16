/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const photos = app.findCollectionByNameOrId("pbc_1234567890")
  const groups = app.findCollectionByNameOrId("pbc_9876543210")

  photos.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2468135790",
    "hidden": false,
    "id": "relation2468135792",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "album",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  groups.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2468135790",
    "hidden": false,
    "id": "relation2468135793",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "album",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  app.save(photos)
  return app.save(groups)
}, (app) => {
  const photos = app.findCollectionByNameOrId("pbc_1234567890")
  const groups = app.findCollectionByNameOrId("pbc_9876543210")

  photos.fields.removeById("relation2468135792")
  groups.fields.removeById("relation2468135793")

  app.save(photos)
  return app.save(groups)
})
