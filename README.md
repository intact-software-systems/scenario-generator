# Generate scenario

The command line tool `scenario-generate` generates a json file with requests to be executed by the
tool `scenario-black-box-execute` or `scenario-execute`

## Nodejs Installation

Requires Nodejs to be installed: https://nodejs.org/en/download/

Make sure the command `npm` is available in terminals (npm = node package manager). More documentation can be found
here https://docs.npmjs.com/

```shell
npm upgrade -g
````

### Install requirements

Clone git repository

```shell
git clone https://github.com/intact-software-systems/scenario-generator.git

cd scenario-generator
```

and from the `scenario-generator` folder execute:

```shell
npm install
npm link
```

### Run the scenario-generate command line tool

Run the example test scenario:

```shell
scenario-generate -c config.json
```

where config can have these properties with examples:

```json
{
  "outputFile": "scenario.json",
  "headerTemplateFile": {
    "HTTP": "./templates/http-header-template.json"
  },
  "replace": {
    "url": "http://localhost:8080"
  },
  "generateForEach": [
    "amount"
  ],
  "numOfScenarios": "2",
  "interactions": [
    {
      "entryName": "createResource",
      "templateFile": "./templates/create-resource-template.json",
      "numOfInteractions": "A positive integer. Default 1",
      "technology": "To match an existing key in template file. Default HTTP.",
      "replace": {
        "branchCondition": "All {branchCondition} in template are replaced with this value",
        "branch": "All {branch} in template are replaced with this value"
      },
      "generateForEach": [
        "uuid"
      ]
    },
    {
      "entryName": "createAnotherResource",
      "templateFile": "./templates/create-another-resource-template.json",
      "replace": {
        "twigs": "All {twigs} in template are replaced with this value"
      },
      "generateForEach": [
        "uuid",
        "date",
        "amount"
      ]
    }
  ]
}
```

Check the terminal for status.

### Template files standard layout

Template file layout

```json
{
  "HTTP": {
    "request": {
      "path": "{url}/api/v1/path/to/resource/{brand}",
      "method": "POST",
      "body": {
        "code": "{sublet}"
      }
    },
    "response": {
      "body": {
      },
      "statusCode": "200"
    }
  }
}
```

### HTTP header template

Can have any key value pairs

```json
{
  "Content-Type": "application/json",
  "Accept": "*/*",
  "x-company-header": "{company}"
}
```
