/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const photos = app.findCollectionByNameOrId("pbc_1234567890")
  const groups = app.findCollectionByNameOrId("pbc_9876543210")

  photos.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number5043921187",
    "max": null,
    "min": null,
    "name": "sortOrder",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  groups.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number5043921188",
    "max": null,
    "min": null,
    "name": "sortOrder",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  app.save(photos)
  return app.save(groups)
}, (app) => {
  const photos = app.findCollectionByNameOrId("pbc_1234567890")
  const groups = app.findCollectionByNameOrId("pbc_9876543210")

  photos.fields.removeById("number5043921187")
  groups.fields.removeById("number5043921188")

  app.save(photos)
  return app.save(groups)
})
