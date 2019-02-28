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
const repository = require('../').repository('test/config/');
const service = require("express")();


// PRIVATE FUNCTIONS

const pingCertificate = function(request, response) {
    try {
        const certificateId = request.params.identifier;
        if (repository.certificateExists(certificateId)) {
            response.writeHead(200, 'Certificate ' + certificateId + ' exists.');
            response.end();
        } else {
            response.writeHead(404, 'Certificate ' + certificateId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const getCertificate = function(request, response) {
    try {
        const certificateId = request.params.identifier;
        const certificate = repository.fetchCertificate(certificateId);
        if (certificate) {
            const data = certificate.toString();
            response.writeHead(200, 'Certificate ' + certificateId + ' was fetched.', {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            response.end(data);
        } else {
            response.writeHead(404, 'Certificate ' + certificateId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const postCertificate = function(request, response) {
    try {
        const certificateId = request.params.identifier;
        const certificate = bali.parse(request.body);
        if (repository.certificateExists(certificateId)) {
            response.writeHead(409, 'Certificate ' + certificateId + ' already exists.');
            response.end();
        } else {
            repository.storeCertificate(certificateId, certificate);
            response.writeHead(201, 'Certificate ' + certificateId + ' was stored.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const putCertificate = function(request, response) {
    response.writeHead(405, 'Certificates cannot be updated.');
    response.end();
};


const deleteCertificate = function(request, response) {
    response.writeHead(405, 'Certificates cannot be deleted.');
    response.end();
};


const pingDraft = function(request, response) {
    try {
        const draftId = request.params.identifier;
        if (repository.draftExists(draftId)) {
            response.writeHead(200, 'Draft ' + draftId + ' exists.');
            response.end();
        } else {
            response.writeHead(404, 'Draft ' + draftId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const getDraft = function(request, response) {
    try {
        const draftId = request.params.identifier;
        const draft = repository.fetchDraft(draftId);
        if (draft) {
            const data = draft.toString();
            response.writeHead(200, 'Draft ' + draftId + ' was fetched.', {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            response.end(data);
        } else {
            response.writeHead(404, 'Draft ' + draftId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const postDraft = function(request, response) {
    try {
        const draftId = request.params.identifier;
        const draft = bali.parse(request.body);
        if (repository.draftExists(draftId)) {
            response.writeHead(409, 'Draft ' + draftId + ' already exists.');
            response.end();
        } else {
            repository.storeDraft(draftId, draft);
            response.writeHead(201, 'Draft ' + draftId + ' was stored.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const putDraft = function(request, response) {
    response.writeHead(405, 'Drafts cannot be updated.');
    response.end();
};


const deleteDraft = function(request, response) {
    response.writeHead(405, 'Drafts cannot be deleted.');
    response.end();
};


const pingDocument = function(request, response) {
    try {
        const documentId = request.params.identifier;
        if (repository.documentExists(documentId)) {
            response.writeHead(200, 'Document ' + documentId + ' exists.');
            response.end();
        } else {
            response.writeHead(404, 'Document ' + documentId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const getDocument = function(request, response) {
    try {
        const documentId = request.params.identifier;
        const document = repository.fetchDocument(documentId);
        if (document) {
            const data = document.toString();
            response.writeHead(200, 'Document ' + documentId + ' was fetched.', {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            response.end(data);
        } else {
            response.writeHead(404, 'Document ' + documentId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const postDocument = function(request, response) {
    try {
        const documentId = request.params.identifier;
        const document = bali.parse(request.body);
        if (repository.documentExists(documentId)) {
            response.writeHead(409, 'Document ' + documentId + ' already exists.');
            response.end();
        } else {
            repository.storeDocument(documentId, document);
            response.writeHead(201, 'Document ' + documentId + ' was stored.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const putDocument = function(request, response) {
    response.writeHead(405, 'Documents cannot be updated.');
    response.end();
};


const deleteDocument = function(request, response) {
    response.writeHead(405, 'Documents cannot be deleted.');
    response.end();
};


const pingType = function(request, response) {
    try {
        const typeId = request.params.identifier;
        if (repository.typeExists(typeId)) {
            response.writeHead(200, 'Type ' + typeId + ' exists.');
            response.end();
        } else {
            response.writeHead(404, 'Type ' + typeId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const getType = function(request, response) {
    try {
        const typeId = request.params.identifier;
        const type = repository.fetchType(typeId);
        if (type) {
            const data = type.toString();
            response.writeHead(200, 'Type ' + typeId + ' was fetched.', {
                'Content-Length': data.length,
                'Content-Type': 'application/bali',
                'Cache-Control': 'immutable'
            });
            response.end(data);
        } else {
            response.writeHead(404, 'Type ' + typeId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const postType = function(request, response) {
    try {
        const typeId = request.params.identifier;
        const type = bali.parse(request.body);
        if (repository.typeExists(typeId)) {
            response.writeHead(409, 'Type ' + typeId + ' already exists.');
            response.end();
        } else {
            repository.storeType(typeId, type);
            response.writeHead(201, 'Type ' + typeId + ' was stored.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const putType = function(request, response) {
    response.writeHead(405, 'Types cannot be updated.');
    response.end();
};


const deleteType = function(request, response) {
    response.writeHead(405, 'Types cannot be deleted.');
    response.end();
};


const pingQueue = function(request, response) {
    try {
        const queueId = request.params.identifier;
        if (repository.queueExists(queueId)) {
            response.writeHead(200, 'Queue ' + queueId + ' exists.');
            response.end();
        } else {
            response.writeHead(404, 'Queue ' + queueId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const postQueue = function(request, response) {
    try {
        const queueId = bali.tag();
        repository.createQueue(queueId);
        response.writeHead(201, 'Queue ' + queueId + ' was created.');
        response.end(queueId);
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const deleteQueue = function(request, response) {
    try {
        const queueId = request.params.identifier;
        if (repository.queueExists(queueId)) {
            repository.deleteQueue(queueId);
            response.writeHead(200, 'Queue ' + queueId + ' was deleted.');
            response.end();
        } else {
            response.writeHead(404, 'Queue ' + queueId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const putMessage = function(request, response) {
    try {
        const queueId = request.params.identifier;
        if (repository.queueExists(queueId)) {
            const message = bali.parse(request.body);
            repository.queueMessage(queueId, message);
            response.writeHead(201, 'Message was added to queue ' + queueId + '.');
            response.end();
        } else {
            response.writeHead(404, 'Queue ' + queueId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


const getMessage = function(request, response) {
    try {
        const queueId = request.params.identifier;
        if (repository.queueExists(queueId)) {
            const message = repository.dequeueMessage(queueId);
            if (message) {
                const data = message.toString();
                response.writeHead(200, 'Message was removed from queue' + queueId + '.', {
                    'Content-Length': data.length,
                    'Content-Type': 'application/bali',
                    'Cache-Control': 'no-store'
                });
                response.end(data);
            } else {
                response.writeHead(204, 'Queue ' + queueId + ' is empty.');
                response.end();
            }
        } else {
            response.writeHead(404, 'Queue ' + queueId + ' does not exist.');
            response.end();
        }
    } catch (e) {
        response.writeHead(400, 'This was a badly formed request.');
        response.end();
    }
};


// SERVICE INITIALIZATION

service.route('/certificate/:identifier')
        .head(pingCertificate)
        .get(getCertificate)
        .post(postCertificate)
        .put(putCertificate)
        .delete(postCertificate);

service.route('/draft/:identifier')
        .head(pingDraft)
        .get(getDraft)
        .post(postDraft)
        .put(putDraft)
        .delete(postDraft);

service.route('/document/:identifier')
        .head(pingDocument)
        .get(getDocument)
        .post(postDocument)
        .put(putDocument)
        .delete(postDocument);

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
    console.log("Server running on port 3000");
});
