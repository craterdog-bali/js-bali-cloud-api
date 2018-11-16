![Logo](https://raw.githubusercontent.com/craterdog-bali/bali-project-documentation/master/images/CraterDogLogo.png)

### Bali Cloud API
This project provides a JavaScript version of the API needed to interact with the [_Bali Cloud Environment™_](https://github.com/craterdog-bali/bali-project-documentation/wiki). It allows a client program to perform the following tasks:
 * manages the client's notary key and public certificate
 * create components and commit them to the cloud repository as notarized documents
 * send and receive notarized messages
 * post notarized events to other interested components

![Pyramid](https://raw.githubusercontent.com/craterdog-bali/bali-project-documentation/master/images/BaliPyramid-CloudAPI.png)

_**WARNING**_
_This project is still in its early stages and the classes and interfaces to the classes are likely to change._

### Quick Links
For more information on this project click on the following links:
 * [wiki](https://github.com/craterdog-bali/js-bali-cloud-api/wiki)
 * [node package](https://www.npmjs.com/package/bali-cloud-api)
 * [release notes](https://github.com/craterdog-bali/js-bali-cloud-api/wiki/releases)
 * [project documentation](https://github.com/craterdog-bali/bali-project-documentation/wiki)

### Highlighted Components
 * **BaliAPI** - a singleton object that acts as a proxy to the Bali Cloud Environment™.
 * **CloudRepository** - a singleton object that acts as a proxy to the Amazon AWS S3 buckets used to store notarized documents.
 * **LocalRepository** - a singleton object that acts as a proxy to the local filesystem used to store notarized documents. This module can be used for local testing.

![Bali Cloud API](https://raw.githubusercontent.com/craterdog-bali/bali-project-documentation/master/images/BaliCloudAPI.png)

### Getting Started
To install this NodeJS package:
```
npm install bali-cloud-api
```

### Contributing
Project contributors are always welcome. Create a [fork](https://github.com/craterdog-bali/js-bali-cloud-api) of the project and add cool new functionality. When you are ready to contribute the changes create a subsequent ["pull request"](https://help.github.com/articles/about-pull-requests/). Any questions and comments can be sent to craterdog@gmail.com.
