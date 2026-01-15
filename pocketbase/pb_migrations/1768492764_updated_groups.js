/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_9876543210")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = user",
    "listRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_9876543210")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id = user",
    "viewRule": "@request.auth.id = user"
  }, collection)

  return app.save(collection)
})
