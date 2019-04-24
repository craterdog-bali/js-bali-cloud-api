/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const debug = false;  // set to true for request-response logging
const bali = require('bali-component-framework');
const repository = require('../').local('test/config/');
const express = require("express");
const bodyParser = require('body-parser');


// PRIVATE FUNCTIONS

const pingName = async function(request, response) {
    const name = request.params.identifier;
    var message = 'Service: ping name: ' + name;
    if (debug) console.log(message);
    try {
        if (await repository.nameExists(name)) {
            message = 'Service: name ' + name + ' exists.';
            if (debug) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: name ' + name + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getName = async function(request, response) {
    const name = request.params.identifier;
    var message = 'Service: get name: ' + name;
    if (debug) console.log(message);
    try {
        const citation = await repository.fetchName(name);
        if (citation) {
            const data = citation.toString();
            message = 'Service: citation for ' + name + ' was fetched.';
            if (debug) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            message = 'Service: name: ' + data;
            if (debug) console.log(message);
            response.end(data);
        } else {
            message = 'Service: name ' + name + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postName = async function(request, response) {
    const name = request.params.identifier;
    var message = 'Service: post name: ' + name + '\n' + request.body;
    if (debug) console.log(message);
    try {
        const citation = request.body;
        if (await repository.nameExists(name)) {
            message = 'Service: name ' + name + ' already exists.';
            if (debug) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.createName(name, citation);
            message = 'Service: name ' + name + ' was stored.';
            if (debug) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putName = async function(request, response) {
    const name = request.params.identifier;
    var message = 'Service: put name: ' + name + '\n' + request.body;
    if (debug) console.log(message);
    message = 'Service: names cannot be updated.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteName = async function(request, response) {
    const name = request.params.identifier;
    var message = 'Service: delete name: ' + name;
    if (debug) console.log(message);
    message = 'Service: names cannot be deleted.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingAccount = async function(request, response) {
    const accountId = request.params.identifier;
    var message = 'Service: ping account: ' + accountId;
    if (debug) console.log(message);
    try {
        if (await repository.accountExists(accountId)) {
            message = 'Service: account ' + accountId + ' exists.';
            if (debug) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: account ' + accountId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getAccount = async function(request, response) {
    const accountId = request.params.identifier;
    var message = 'Service: get account: ' + accountId;
    if (debug) console.log(message);
    try {
        const account = await repository.fetchAccount(accountId);
        if (account) {
            const data = account.toString();
            message = 'Service: account ' + accountId + ' was fetched.';
            if (debug) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            message = 'Service: account: ' + data;
            if (debug) console.log(message);
            response.end(data);
        } else {
            message = 'Service: account ' + accountId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postAccount = async function(request, response) {
    const accountId = request.params.identifier;
    var message = 'Service: post account: ' + accountId + '\n' + request.body;
    if (debug) console.log(message);
    try {
        const account = request.body;
        if (await repository.accountExists(accountId)) {
            message = 'Service: account ' + accountId + ' already exists.';
            if (debug) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.createAccount(accountId, account);
            message = 'Service: account ' + accountId + ' was stored.';
            if (debug) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putAccount = async function(request, response) {
    const accountId = request.params.identifier;
    var message = 'Service: put account: ' + accountId + '\n' + request.body;
    if (debug) console.log(message);
    message = 'Service: accounts cannot be updated.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteAccount = async function(request, response) {
    const accountId = request.params.identifier;
    var message = 'Service: delete account: ' + accountId;
    if (debug) console.log(message);
    message = 'Service: accounts cannot be deleted.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: ping certificate: ' + certificateId;
    if (debug) console.log(message);
    try {
        if (await repository.certificateExists(certificateId)) {
            message = 'Service: certificate ' + certificateId + ' exists.';
            if (debug) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: certificate ' + certificateId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: get certificate: ' + certificateId;
    if (debug) console.log(message);
    try {
        const certificate = await repository.fetchCertificate(certificateId);
        if (certificate) {
            const data = certificate.toString();
            message = 'Service: certificate ' + certificateId + ' was fetched.';
            if (debug) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            message = 'Service: certificate: ' + data;
            if (debug) console.log(message);
            response.end(data);
        } else {
            message = 'Service: certificate ' + certificateId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: post certificate: ' + certificateId + '\n' + request.body;
    if (debug) console.log(message);
    try {
        const certificate = request.body;
        if (await repository.certificateExists(certificateId)) {
            message = 'Service: certificate ' + certificateId + ' already exists.';
            if (debug) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.createCertificate(certificateId, certificate);
            message = 'Service: certificate ' + certificateId + ' was stored.';
            if (debug) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: put certificate: ' + certificateId + '\n' + request.body;
    if (debug) console.log(message);
    message = 'Service: certificates cannot be updated.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: delete certificate: ' + certificateId;
    if (debug) console.log(message);
    message = 'Service: certificates cannot be deleted.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: ping draft document: ' + draftId;
    if (debug) console.log(message);
    try {
        if (await repository.draftExists(draftId)) {
            message = 'Service: draft document ' + draftId + ' exists.';
            if (debug) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: draft document ' + draftId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: get draft document: ' + draftId;
    if (debug) console.log(message);
    try {
        const draft = await repository.fetchDraft(draftId);
        if (draft) {
            const data = draft.toString();
            message = 'Service: draft document ' + draftId + ' was fetched.';
            if (debug) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'no-store'
            });
            message = 'Service: draft document: ' + data;
            if (debug) console.log(message);
            response.end(data);
        } else {
            message = 'Service: draft document ' + draftId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: post draft: ' + draftId + '\n' + request.body;
    if (debug) console.log(message);
    message = 'Service: drafts cannot be posted.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const putDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: put draft document: ' + draftId + '\n' + request.body;
    if (debug) console.log(message);
    try {
        const draft = request.body;
        if (await repository.documentExists(draftId)) {
            message = 'Service: a committed document ' + draftId + ' already exists.';
            if (debug) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.saveDraft(draftId, draft);
            message = 'Service: draft ' + draftId + ' was saved.';
            if (debug) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const deleteDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: delete draft document: ' + draftId;
    if (debug) console.log(message);
    try {
        if (await repository.draftExists(draftId)) {
            await repository.deleteDraft(draftId);
            message = 'Service: draft document ' + draftId + ' was deleted.';
            if (debug) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: draft document ' + draftId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const pingDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: ping document: ' + documentId;
    if (debug) console.log(message);
    try {
        if (await repository.documentExists(documentId)) {
            message = 'Service: document ' + documentId + ' exists.';
            if (debug) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: document ' + documentId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: get document: ' + documentId;
    if (debug) console.log(message);
    try {
        const documentId = request.params.identifier;
        const document = await repository.fetchDocument(documentId);
        if (document) {
            const data = document.toString();
            message = 'Service: document ' + documentId + ' was fetched.';
            if (debug) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            message = 'Service: document: ' + data;
            if (debug) console.log(message);
            response.end(data);
        } else {
            message = 'Service: document ' + documentId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: post document: ' + documentId + '\n' + request.body;
    if (debug) console.log(message);
    try {
        const document = request.body;
        if (await repository.documentExists(documentId)) {
            message = 'Service: document ' + documentId + ' already exists.';
            if (debug) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.createDocument(documentId, document);
            message = 'Service: document ' + documentId + ' was stored.';
            if (debug) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: put document: ' + documentId + '\n' + request.body;
    if (debug) console.log(message);
    message = 'Service: documents cannot be updated.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: delete document: ' + documentId;
    if (debug) console.log(message);
    message = 'Service: documents cannot be deleted.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: ping type: ' + typeId;
    if (debug) console.log(message);
    try {
        if (await repository.typeExists(typeId)) {
            message = 'Service: type ' + typeId + ' exists.';
            if (debug) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: type ' + typeId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: get type: ' + typeId;
    if (debug) console.log(message);
    try {
        const type = await repository.fetchType(typeId);
        if (type) {
            const data = type.toString();
            message = 'Service: type ' + typeId + ' was fetched.';
            if (debug) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            message = 'Service: type: ' + data;
            if (debug) console.log(message);
            response.end(data);
        } else {
            message = 'Service: type ' + typeId + ' does not exist.';
            if (debug) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: post type: ' + typeId + '\n' + request.body;
    if (debug) console.log(message);
    try {
        const type = request.body;
        if (await repository.typeExists(typeId)) {
            message = 'Service: type ' + typeId + ' already exists.';
            if (debug) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.createType(typeId, type);
            message = 'Service: type ' + typeId + ' was stored.';
            if (debug) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: put type: ' + typeId + '\n' + request.body;
    if (debug) console.log(message);
    message = 'Service: types cannot be updated.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: delete type: ' + typeId;
    if (debug) console.log(message);
    message = 'Service: types cannot be deleted.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingQueue = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: ping queue: ' + queueId;
    if (debug) console.log(message);
    message = 'Service: queues cannot be pinged.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const postQueue = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: post queue: ' + queueId + '\n' + request.body;
    if (debug) console.log(message);
    message = 'Service: queues cannot be posted.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteQueue = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: delete queue: ' + queueId;
    if (debug) console.log(message);
    message = 'Service: queues cannot be deleted.';
    if (debug) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const putMessage = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: put message on queue: ' + queueId + '\n' + request.body;
    if (debug) console.log(message);
    try {
        message = request.body;
        await repository.queueMessage(queueId, message);
        message = 'Service: message was added to queue ' + queueId + '.';
        if (debug) console.log(message);
        response.writeHead(201, message);
        response.end();
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getMessage = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: get message from queue: ' + queueId;
    if (debug) console.log(message);
    try {
        message = await repository.dequeueMessage(queueId);
        if (message) {
            const data = message.toString();
            message = 'Service: message was removed from queue ' + queueId + '.';
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'no-store'
            });
            message = 'Service: message: ' + data;
            if (debug) console.log(message);
            response.end(data);
        } else {
            message = 'Service: queue ' + queueId + ' is empty.';
            if (debug) console.log(message);
            response.writeHead(204, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (debug) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


// SERVICE INITIALIZATION

const nameRouter = express.Router();
nameRouter.head('/:identifier([a-zA-Z0-9/\\.]+)', pingName);
nameRouter.post('/:identifier([a-zA-Z0-9/\\.]+)', postName);
nameRouter.get('/:identifier([a-zA-Z0-9/\\.]+)', getName);
nameRouter.put('/:identifier([a-zA-Z0-9/\\.]+)', putName);
nameRouter.delete('/:identifier([a-zA-Z0-9/\\.]+)', deleteName);

const accountRouter = express.Router();
accountRouter.head('/:identifier', pingAccount);
accountRouter.post('/:identifier', postAccount);
accountRouter.get('/:identifier', getAccount);
accountRouter.put('/:identifier', putAccount);
accountRouter.delete('/:identifier', deleteAccount);

const certificateRouter = express.Router();
certificateRouter.head('/:identifier', pingCertificate);
certificateRouter.post('/:identifier', postCertificate);
certificateRouter.get('/:identifier', getCertificate);
certificateRouter.put('/:identifier', putCertificate);
certificateRouter.delete('/:identifier', deleteCertificate);

const draftRouter = express.Router();
draftRouter.head('/:identifier', pingDraft);
draftRouter.post('/:identifier', postDraft);
draftRouter.get('/:identifier', getDraft);
draftRouter.put('/:identifier', putDraft);
draftRouter.delete('/:identifier', deleteDraft);

const documentRouter = express.Router();
documentRouter.head('/:identifier', pingDocument);
documentRouter.post('/:identifier', postDocument);
documentRouter.get('/:identifier', getDocument);
documentRouter.put('/:identifier', putDocument);
documentRouter.delete('/:identifier', deleteDocument);

const typeRouter = express.Router();
typeRouter.head('/:identifier', pingType);
typeRouter.post('/:identifier', postType);
typeRouter.get('/:identifier', getType);
typeRouter.put('/:identifier', putType);
typeRouter.delete('/:identifier', deleteType);

const queueRouter = express.Router();
queueRouter.head('/:identifier', pingQueue);
queueRouter.post('/:identifier', postQueue);
queueRouter.get('/:identifier', getMessage);
queueRouter.put('/:identifier', putMessage);
queueRouter.delete('/:identifier', deleteQueue);

const service = express();

service.use(bodyParser.text({ type: 'application/bali' }));
service.use('/name', nameRouter);
service.use('/certificate', certificateRouter);
service.use('/draft', draftRouter);
service.use('/document', documentRouter);
service.use('/type', typeRouter);
service.use('/queue', queueRouter);

service.listen(3000, function() {
    var message = 'Service: Server running on port 3000';
    if (debug) console.log(message);
});
