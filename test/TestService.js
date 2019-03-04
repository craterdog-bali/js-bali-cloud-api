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
const service = require("express")();
const bodyParser = require('body-parser');
const isLogging = false;


// PRIVATE FUNCTIONS

const pingCertificate = function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: ping certificate: ' + certificateId;
    if (isLogging) console.log(message);
    try {
        if (repository.certificateExists(certificateId)) {
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


const getCertificate = function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: get certificate: ' + certificateId;
    if (isLogging) console.log(message);
    try {
        const certificate = repository.fetchCertificate(certificateId);
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


const postCertificate = function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: post certificate: ' + certificateId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const certificate = bali.parse(request.body);
        if (repository.certificateExists(certificateId)) {
            message = 'Service: certificate ' + certificateId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            repository.storeCertificate(certificateId, certificate);
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


const putCertificate = function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: put certificate: ' + certificateId + '\n' + request.body;
    if (isLogging) console.log(message);
    message = 'Service: certificates cannot be updated.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteCertificate = function(request, response) {
    const certificateId = request.params.identifier;
    var message = 'Service: delete certificate: ' + certificateId;
    if (isLogging) console.log(message);
    message = 'Service: certificates cannot be deleted.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingDraft = function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: ping draft document: ' + draftId;
    if (isLogging) console.log(message);
    try {
        if (repository.draftExists(draftId)) {
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


const getDraft = function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: get draft document: ' + draftId;
    if (isLogging) console.log(message);
    try {
        const draft = repository.fetchDraft(draftId);
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


const postDraft = function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: post draft document: ' + draftId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const draft = bali.parse(request.body);
        if (repository.documentExists(draftId)) {
            message = 'Service: a committed document ' + draftId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else if (repository.draftExists(draftId)) {
            message = 'Service: draft document ' + draftId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            repository.storeDraft(draftId, draft);
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


const putDraft = function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: put draft document: ' + draftId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const draft = bali.parse(request.body);
        if (repository.documentExists(draftId)) {
            message = 'Service: a committed document ' + draftId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else if (!repository.draftExists(draftId)) {
            message = 'Service: draft document ' + draftId + ' does not exist.';
            if (isLogging) console.log(message);
            response.writeHead(404, message);
            response.end();
        } else {
            repository.storeDraft(draftId, draft);
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


const deleteDraft = function(request, response) {
    const draftId = request.params.identifier;
    var message = 'Service: delete draft document: ' + draftId;
    if (isLogging) console.log(message);
    try {
        if (repository.draftExists(draftId)) {
            repository.deleteDraft(draftId);
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


const pingDocument = function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: ping document: ' + documentId;
    if (isLogging) console.log(message);
    try {
        if (repository.documentExists(documentId)) {
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


const getDocument = function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: get document: ' + documentId;
    if (isLogging) console.log(message);
    try {
        const documentId = request.params.identifier;
        const document = repository.fetchDocument(documentId);
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


const postDocument = function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: post document: ' + documentId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const document = bali.parse(request.body);
        if (repository.documentExists(documentId)) {
            message = 'Service: document ' + documentId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            repository.storeDocument(documentId, document);
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


const putDocument = function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: put document: ' + documentId + '\n' + request.body;
    if (isLogging) console.log(message);
    message = 'Service: documents cannot be updated.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteDocument = function(request, response) {
    const documentId = request.params.identifier;
    var message = 'Service: delete document: ' + documentId;
    if (isLogging) console.log(message);
    message = 'Service: documents cannot be deleted.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingType = function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: ping type: ' + typeId;
    if (isLogging) console.log(message);
    try {
        if (repository.typeExists(typeId)) {
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


const getType = function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: get type: ' + typeId;
    if (isLogging) console.log(message);
    try {
        const type = repository.fetchType(typeId);
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


const postType = function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: post type: ' + typeId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        const type = bali.parse(request.body);
        if (repository.typeExists(typeId)) {
            message = 'Service: type ' + typeId + ' already exists.';
            if (isLogging) console.log(message);
            response.writeHead(409, message);
            response.end();
        } else {
            repository.storeDocument(typeId, type);
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


const putType = function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: put type: ' + typeId + '\n' + request.body;
    if (isLogging) console.log(message);
    message = 'Service: types cannot be updated.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const deleteType = function(request, response) {
    const typeId = request.params.identifier;
    var message = 'Service: delete type: ' + typeId;
    if (isLogging) console.log(message);
    message = 'Service: types cannot be deleted.';
    if (isLogging) console.log(message);
    response.writeHead(405, message);
    response.end();
};


const pingQueue = function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: ping queue: ' + queueId;
    if (isLogging) console.log(message);
    try {
        if (repository.queueExists(queueId)) {
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


const postQueue = function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: post queue: ' + queueId;
    if (isLogging) console.log(message);
    try {
        repository.createQueue(queueId);
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


const deleteQueue = function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: delete queue: ' + queueId;
    if (isLogging) console.log(message);
    try {
        if (repository.queueExists(queueId)) {
            repository.deleteQueue(queueId);
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


const putMessage = function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: put message on queue: ' + queueId + '\n' + request.body;
    if (isLogging) console.log(message);
    try {
        if (repository.queueExists(queueId)) {
            message = bali.parse(request.body);
            repository.queueMessage(queueId, message);
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


const getMessage = function(request, response) {
    const queueId = request.params.identifier;
    var message = 'Service: get message from queue: ' + queueId;
    if (isLogging) console.log(message);
    try {
        const queueId = request.params.identifier;
        if (repository.queueExists(queueId)) {
            message = repository.dequeueMessage(queueId);
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

service.use(bodyParser.text({ type: 'application/bali' }));

service.route('/certificate/:identifier')
        .head(pingCertificate)
        .get(getCertificate)
        .post(postCertificate)
        .put(putCertificate)
        .delete(deleteCertificate);

service.route('/draft/:identifier')
        .head(pingDraft)
        .get(getDraft)
        .post(postDraft)
        .put(putDraft)
        .delete(deleteDraft);

service.route('/document/:identifier')
        .head(pingDocument)
        .get(getDocument)
        .post(postDocument)
        .put(putDocument)
        .delete(deleteDocument);

service.route('/type/:identifier')
        .head(pingType)
        .get(getType)
        .post(postType)
        .put(putType)
        .delete(deleteType);

service.route('/queue/:identifier')
        .head(pingQueue)
        .get(getMessage)
        .post(postQueue)
        .put(putMessage)
        .delete(deleteQueue);

service.listen(3000, function() {
    var message = 'Service: Server running on port 3000';
    if (isLogging) console.log(message);
});
