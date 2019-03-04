/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const bali = require('bali-component-framework');
const repository = require('../').local('test/config/');
const express = require("express");
const bodyParser = require('body-parser');
/* global Promise */
const isLogging = false;


// PRIVATE FUNCTIONS

const pingCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: ping certificate: ' + certificateId;
    if (isLogging) console.log(message);
    try {
        if (await repository.certificateExists(certificateId)) {
            message = 'Service: certificate ' + certificateId + ' exists.';
            if (isLogging) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: certificate ' + certificateId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: get certificate: ' + certificateId;
    if (isLogging) console.log(message);
    try {
        const certificate = await repository.fetchCertificate(certificateId);
        if (certificate) {
            const data = certificate.toString();
            message = 'Service: certificate ' + certificateId + ' was fetched.';
            if (isLogging) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            message = 'Service: certificate: ' + data;
            if (isLogging) console.log(message);
            response.end(data);
        } else {
            message = 'Service: certificate ' + certificateId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: post certificate: ' + certificateId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const certificate = request.body;
        if (await repository.certificateExists(certificateId)) {
            message = 'Service: certificate ' + certificateId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.storeCertificate(certificateId, certificate);
            message = 'Service: certificate ' + certificateId + ' was stored.';
            if (isLogging) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: put certificate: ' + certificateId + '\n' + request.body;
    if (isLogging) console.log(message);
    message = 'Service: certificates cannot be updated.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteCertificate = async function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: delete certificate: ' + certificateId;
    if (isLogging) console.log(message);
    message = 'Service: certificates cannot be deleted.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: ping draft document: ' + draftId;
    if (isLogging) console.log(message);
    try {
        if (await repository.draftExists(draftId)) {
            message = 'Service: draft document ' + draftId + ' exists.';
            if (isLogging) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: draft document ' + draftId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: get draft document: ' + draftId;
    if (isLogging) console.log(message);
    try {
        const draft = await repository.fetchDraft(draftId);
        if (draft) {
            const data = draft.toString();
            message = 'Service: draft document ' + draftId + ' was fetched.';
            if (isLogging) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'no-store'
            });
            message = 'Service: draft document: ' + data;
            if (isLogging) console.log(message);
            response.end(data);
        } else {
            message = 'Service: draft document ' + draftId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: post draft document: ' + draftId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const draft = request.body;
        if (await repository.documentExists(draftId)) {
            message = 'Service: a committed document ' + draftId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else if (await repository.draftExists(draftId)) {
            message = 'Service: draft document ' + draftId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.storeDraft(draftId, draft);
            message = 'Service: draft ' + draftId + ' was stored.';
            if (isLogging) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: put draft document: ' + draftId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const draft = request.body;
        if (await repository.documentExists(draftId)) {
            message = 'Service: a committed document ' + draftId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else if (!await repository.draftExists(draftId)) {
            message = 'Service: draft document ' + draftId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        } else {
            await repository.storeDraft(draftId, draft);
            message = 'Service: draft ' + draftId + ' was updated.';
            if (isLogging) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const deleteDraft = async function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: delete draft document: ' + draftId;
    if (isLogging) console.log(message);
    try {
        if (await repository.draftExists(draftId)) {
            await repository.deleteDraft(draftId);
            message = 'Service: draft document ' + draftId + ' was deleted.';
            if (isLogging) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: draft document ' + draftId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const pingDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: ping document: ' + documentId;
    if (isLogging) console.log(message);
    try {
        if (await repository.documentExists(documentId)) {
            message = 'Service: document ' + documentId + ' exists.';
            if (isLogging) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: document ' + documentId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: get document: ' + documentId;
    if (isLogging) console.log(message);
    try {
        const documentId = request.params.identifier;
        const document = await repository.fetchDocument(documentId);
        if (document) {
            const data = document.toString();
            message = 'Service: document ' + documentId + ' was fetched.';
            if (isLogging) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            message = 'Service: document: ' + data;
            if (isLogging) console.log(message);
            response.end(data);
        } else {
            message = 'Service: document ' + documentId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: post document: ' + documentId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const document = request.body;
        if (await repository.documentExists(documentId)) {
            message = 'Service: document ' + documentId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.storeDocument(documentId, document);
            message = 'Service: document ' + documentId + ' was stored.';
            if (isLogging) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: put document: ' + documentId + '\n' + request.body;
    if (isLogging) console.log(message);
    message = 'Service: documents cannot be updated.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteDocument = async function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: delete document: ' + documentId;
    if (isLogging) console.log(message);
    message = 'Service: documents cannot be deleted.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: ping type: ' + typeId;
    if (isLogging) console.log(message);
    try {
        if (await repository.typeExists(typeId)) {
            message = 'Service: type ' + typeId + ' exists.';
            if (isLogging) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: type ' + typeId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: get type: ' + typeId;
    if (isLogging) console.log(message);
    try {
        const type = await repository.fetchType(typeId);
        if (type) {
            const data = type.toString();
            message = 'Service: type ' + typeId + ' was fetched.';
            if (isLogging) console.log(message);
            response.writeHead(200, message, {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            message = 'Service: type: ' + data;
            if (isLogging) console.log(message);
            response.end(data);
        } else {
            message = 'Service: type ' + typeId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: post type: ' + typeId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const type = request.body;
        if (await repository.typeExists(typeId)) {
            message = 'Service: type ' + typeId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            await repository.storeDocument(typeId, type);
            message = 'Service: type ' + typeId + ' was stored.';
            if (isLogging) console.log(message);
            response.writeHead(201, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: put type: ' + typeId + '\n' + request.body;
    if (isLogging) console.log(message);
    message = 'Service: types cannot be updated.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteType = async function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: delete type: ' + typeId;
    if (isLogging) console.log(message);
    message = 'Service: types cannot be deleted.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingQueue = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: ping queue: ' + queueId;
    if (isLogging) console.log(message);
    try {
        if (await repository.queueExists(queueId)) {
            message = 'Service: queue ' + queueId + ' exists.';
            if (isLogging) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: queue ' + queueId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const postQueue = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: post queue: ' + queueId;
    if (isLogging) console.log(message);
    try {
        await repository.createQueue(queueId);
        message = 'Service: queue ' + queueId + ' was created.';
        if (isLogging) console.log(message);
        response.writeHead(201, message);
        response.end();
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const deleteQueue = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: delete queue: ' + queueId;
    if (isLogging) console.log(message);
    try {
        if (await repository.queueExists(queueId)) {
            await repository.deleteQueue(queueId);
            message = 'Service: queue ' + queueId + ' was deleted.';
            if (isLogging) console.log(message);
            response.writeHead(200, message);
            response.end();
        } else {
            message = 'Service: queue ' + queueId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const putMessage = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: put message on queue: ' + queueId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        if (await repository.queueExists(queueId)) {
            message = request.body;
            await repository.queueMessage(queueId, message);
            message = 'Service: message was added to queue ' + queueId + '.';
            if (isLogging) console.log(message);
            response.writeHead(201, message);
            response.end();
        } else {
            message = 'Service: queue ' + queueId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


const getMessage = async function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: get message from queue: ' + queueId;
    if (isLogging) console.log(message);
    try {
        const queueId = request.params.identifier;
        if (await repository.queueExists(queueId)) {
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
                if (isLogging) console.log(message);
                response.end(data);
            } else {
                message = 'Service: queue ' + queueId + ' is empty.';
                if (isLogging) console.log(message);
                response.writeHead(204, message);
                response.end();
            }
        } else {
            message = 'Service: queue ' + queueId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        }
    } catch (e) {
        message = 'Service: the request was badly formed: ' + e.message;
        if (isLogging) console.log(message);
        response.writeHead(400, message);
        response.end();
    }
};


// SERVICE INITIALIZATION

const defaultErrorHandler = console.error;

const asyncRoute = function(route) {
    return function(req, res, next = defaultErrorHandler) {
        return Promise.resolve(route(req, res)).catch(next);
    };
};

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
service.use('/certificate', certificateRouter);
service.use('/draft', draftRouter);
service.use('/document', documentRouter);
service.use('/type', typeRouter);
service.use('/queue', queueRouter);

service.listen(3000, function() {
    var message = 'Service: Server running on port 3000';
    if (isLogging) console.log(message);
});
