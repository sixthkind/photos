/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2468135790")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number1063427325",
    "max": null,
    "min": null,
    "name": "sortOrder",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2468135790")

  // remove field
  collection.fields.removeById("number1063427325")

  return app.save(collection)
})
