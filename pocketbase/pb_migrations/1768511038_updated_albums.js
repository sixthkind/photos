/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("albums")
  } catch (error) {
    return
  }

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = user",
    "deleteRule": "@request.auth.id = user",
    "listRule": "",
    "updateRule": "@request.auth.id = user",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("albums")
  } catch (error) {
    return
  }

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
