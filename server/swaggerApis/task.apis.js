/**
 * @swagger
 * components:
 *   schemas:
 *     taskCreateResponse:
 *       type: object
 *       example:
 *         respCode: 204
 *         respMessage: Task created sucessfully  
 *         taskId: 65cf00cf79006139a66bfd62
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     taskUpdateResponse:
 *       type: object
 *       example:
 *         respCode: 205
 *         respMessage: Task updated sucessfully  
 *         taskId: 65cf00cf79006139a66bfd62
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     taskDeleteResponse:
 *       type: object
 *       example:
 *         respCode: 206
 *         respMessage: Task deleted sucessfully  
 *         taskId: 65cf00cf79006139a66bfd62
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
 * /api/tasks:
 *   get:
 *     tags:
 *        - Task
 *     summary: Get all task from MongoDB
 *     description: Retrieve all orders records from MongoDB.
 *     responses:
 *       200:
 *         description: Successful response
 */

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   get:
 *     tags:
 *        - Task
 *     summary: Get a specific task by ID
 *     description: Retrieve a specific order record from MongoDB by its ID.
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         type: string
 *         description: ID of the task to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     tags:
 *       - Task
 *     summary: Create a new task
 *     description: Create a new task record in MongoDB.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/taskInputSchema'
 *     responses:
 *       204:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/taskCreateResponse'
 */

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   put:
 *     tags:
 *         - Task
 *     summary: Update a specific task by ID
 *     description: Update a specific task record in MongoDB by its ID.
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         type: string
 *         description: ID of the task to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/taskInputSchema'
 *     responses:
 *       200:
 *         description: task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/taskUpdateResponse'
 * 
 */

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   delete:
 *     tags:
 *        - Task
 *     summary: Delete a specific task by ID
 *     description: Delete a specific task record from MongoDB by its ID.
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         type: string
 *         description: ID of the task to delete
 *     responses:
 *       200:
 *         description: task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/taskDeleteResponse'
 */

/**
 * @swagger
 * /api/tasks/multiDelete:
 *   post:
 *     tags:
 *       - Task   
 *     summary: Delete multiple task records
 *     description: Delete multiple task records from MongoDB.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/MultideleteInput'
 *     responses:
 *       204:
 *         description: task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/taskDeleteResponse'
 */