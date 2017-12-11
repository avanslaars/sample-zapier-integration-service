'use strict'

const Hapi = require('hapi')
const faker = require('faker')
const {pathOr, compose} = require('ramda')


const projects = [{id: 1, name: 'Default'}]
const runs = [
  {id: 1, pass: true, project: 'Default', testRun: Date.now().toString()},
  {id: 2, pass: false, project: 'Default', testRun: Date.now().toString()}
]

const getProject = (name) => {
  const search = name ? name.toLowerCase() : ''
  const project = projects.find(p => p.name.toLowerCase() === search)
  return project ? project.name : 'Default'
}

const getProjectFromPayload = compose(getProject, pathOr('', ['payload', 'project']))

// Create a server with a host and port
const server = Hapi.server({
  host: 'localhost',
  port: 8000
})

// Add the route
server.route([{
  method: 'GET',
  path: '/auth',
  handler: function(request, h) {
    const token = request.headers['avs-auth-token']
    const statusCode = token === '12345' ? 200 : 500
    return h.response().code(statusCode)
  }
}, {
  method: 'GET',
  path: '/projects',
  handler: function(request, h) {
    return projects
  }
}, {
  method: 'GET',
  path: '/runs/all',
  handler: function(request, h) {
    return runs
  }
}, {
  method: 'POST',
  path: '/projects/add',
  handler: function(request, h) {
    const newProject = {
      id: Date.now().toString(),
      name: request.payload.name || faker.name.firstName()
    }
    projects.push(newProject)
    return newProject
  }
}, {
  method: 'POST',
  path: '/runs/add/pass',
  handler: function (request, h) {
    const project = getProjectFromPayload(request)
    const newRecord = {
      id: Date.now().toString(),
      pass: true,
      project: project
    }
    runs.push(newRecord)
    return runs
  }
}, {
  method: 'POST',
  path: '/runs/add/fail',
  handler: function (request, h) {
    const project = getProjectFromPayload(request)
    const newRecord = {
      id: Date.now().toString(),
      pass: false,
      project: project
    }
    runs.push(newRecord)
    return runs
  }
}, {
  method: 'GET',
  path: '/runs/{project?}',
  handler: function (request, h) {
    const project = getProject(request.params.project)
    return runs.filter(r => r.project === project)
  }
}, {
  method: 'GET',
  path: '/runs/passed/{project?}',
  handler: function (request, h) {
    const project = getProject(request.params.project)
    return runs.filter(r => r.project === project && r.pass)
  }
}, {
  method: 'GET',
  path: '/runs/failed/{project?}',
  handler: function (request, h) {
    const project = getProject(request.params.project)
    return runs.filter(r => r.project === project && !r.pass)
  }
}])

// Start the server
async function start() {

  try {
    await server.start()
  }
  catch (err) {
    console.log(err)
    process.exit(1)
  }

  console.log('Server running at:', server.info.uri)
}

start()