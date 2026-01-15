/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1234567890")

  if (!collection.fields.getByName("tags")) {
    collection.fields.addAt(4, new Field({
      "cascadeDelete": false,
      "collectionId": "pbc_1219621782",
      "hidden": false,
      "id": "relation1219621782",
      "maxSelect": 10,
      "minSelect": 0,
      "name": "tags",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }))
  }

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1234567890")

  if (collection.fields.getByName("tags")) {
    collection.fields.removeById("relation1219621782")
  }

  return app.save(collection)
})
