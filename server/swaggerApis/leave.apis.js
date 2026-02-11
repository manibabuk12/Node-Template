/**
 * @swagger
 * components:
 *   schemas:
 *     leaveCreateResponse:
 *       type: object
 *       example:
 *         respCode: 204
 *         respMessage: Leave created sucessfully  
 *         leaveId: 65cf00cf79006139a66bfd62
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     leaveUpdateResponse:
 *       type: object
 *       example:
 *         respCode: 205
 *         respMessage: Leave updated sucessfully  
 *         leaveId: 65cf00cf79006139a66bfd62
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     leaveDeleteResponse:
 *       type: object
 *       example:
 *         respCode: 206
 *         respMessage: Leave deleted sucessfully  
 *         leaveId: 65cf00cf79006139a66bfd62
 */

/**
 * @swagger
 * components:
 *      schemas:
 *          MultideleteInput:
 *              type: object
 *              required:
 *                  - selectedIds
 *              properties:
 *                  selectedIds:
 *                       type: array
 *                       description: ArrayofStrings
 *              example:
 *                    selectedIds: ArrayOfStrings
 *              
 */

/**
 * @swagger
 * /api/leaves:
 *   get:
 *     tags:
 *        - Leave
 *     summary: Get all leave from MongoDB
 *     description: Retrieve all orders records from MongoDB.
 *     responses:
 *       200:
 *         description: Successful response
 */

/**
 * @swagger
 * /api/leaves/{leaveId}:
 *   get:
 *     tags:
 *        - Leave
 *     summary: Get a specific leave by ID
 *     description: Retrieve a specific order record from MongoDB by its ID.
 *     parameters:
 *       - name: leaveId
 *         in: path
 *         required: true
 *         type: string
 *         description: ID of the leave to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 */

/**
 * @swagger
 * /api/leaves:
 *   post:
 *     tags:
 *       - Leave
 *     summary: Create a new leave
 *     description: Create a new leave record in MongoDB.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/leaveInputSchema'
 *     responses:
 *       204:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/leaveCreateResponse'
 */

/**
 * @swagger
 * /api/leaves/{leaveId}:
 *   put:
 *     tags:
 *         - Leave
 *     summary: Update a specific leave by ID
 *     description: Update a specific leave record in MongoDB by its ID.
 *     parameters:
 *       - name: leaveId
 *         in: path
 *         required: true
 *         type: string
 *         description: ID of the leave to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/leaveInputSchema'
 *     responses:
 *       200:
 *         description: leave updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/leaveUpdateResponse'
 * 
 */

/**
 * @swagger
 * /api/leaves/{leaveId}:
 *   delete:
 *     tags:
 *        - Leave
 *     summary: Delete a specific leave by ID
 *     description: Delete a specific leave record from MongoDB by its ID.
 *     parameters:
 *       - name: leaveId
 *         in: path
 *         required: true
 *         type: string
 *         description: ID of the leave to delete
 *     responses:
 *       200:
 *         description: leave deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/leaveDeleteResponse'
 */

/**
 * @swagger
 * /api/leaves/multiDelete:
 *   post:
 *     tags:
 *       - Leave   
 *     summary: Delete multiple leave records
 *     description: Delete multiple leave records from MongoDB.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/MultideleteInput'
 *     responses:
 *       204:
 *         description: leave deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/leaveDeleteResponse'
 */