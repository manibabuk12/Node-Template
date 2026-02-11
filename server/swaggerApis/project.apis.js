/**@component for project login*/
/**
 * @swagger
 * components:
 *   schemas:
 *     projectLoginInput:
 *       type: object
 *       example:
 *         email: project@yopmail.com
 *         password: yourpassword
 *         entityType: project  
 */

/**@component for project loginResponse*/
/**
 * @swagger
 * components:
 *   schemas:
 *     projectloginResponse:
 *       type: object
 *       example:
 *         respCode: 200
 *         respMessage: Successfully logged in.
 *         accessToken: 1234t
 *         refreshToken: 13245
 *         password: yourpassword
 *         entityType: project  
 *         details: projectdetails
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     projectLogoutResponse:
 *       type: object
 *       example:
 *         respCode: 200
 *         respMessage: logout successfully
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     projectForgotPasswordInput:
 *       type: object
 *       example:
 *         entityType: project  
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     projectForgotPasswordResponse:
 *       type: object
 *       properties:
 *         respCode:
 *           type: integer
 *           example: 200
 *           description: HTTP status code
 *         respMessage:
 *           type: string
 *           example: "Mail sent successfully"
 *           description: Message confirming password reset initiation
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     projectCreateChangeRecoveryPasswordInput:
 *       type: object
 *       example:
 *         enEmail: encoded email from forgot password
 *         entityType: project  
 *         newPassword: newpassword
 *         confirmPassword: confirmpassword
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     projectChangeRecoveryPasswordResponse:
 *       type: object
 *       properties:
 *         respCode:
 *           type: integer
 *           example: 200
 *           description: HTTP status code
 *         respMessage:
 *           type: string
 *           example: "Password created successfully."
 *           description: Message confirming password reset initiation
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     projectCreateChangePasswordInput:
 *       type: object
 *       example:
 *         email: encoded email from forgot password
 *         entityType: employee  
 *         currentPassword: currentpassword
 *         newPassword: newpassword
 *         confirmPassword: confirmpassword
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     projectChangePasswordResponse:
 *       type: object
 *       properties:
 *         respCode:
 *           type: integer
 *           example: 200
 *           description: HTTP status code
 *         respMessage:
 *           type: string
 *           example: "Password changed successfully."
 *           description: Message confirming password reset initiation
 */


/**@swagger apis */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Project
 *     description: Project login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/projectLoginInput'
 *     responses:
 *       201:
 *         description: Project login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/projectloginResponse'
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Project
 *     description: Project logout
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/projectLoginInput'
 *     responses:
 *       200:
 *         description: Project logout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/projectLogoutResponse'
 */

/**
 * @swagger
 * /api/auth/forgotPassword:
 *   post:
 *     tags:
 *       - Project
 *     description: Initiate password reset for a user
 *     parameters:
 *       - in: query
 *         name: email
 *         description: Email address of the user requesting password reset
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/projectForgotPasswordInput'
 *     responses:
 *       200:
 *         description: Password reset initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/projectForgotPasswordResponse'
 */

/**
 * @swagger
 * /api/auth/changeRecoverPassword:
 *   post:
 *     tags:
 *       - Project
 *     description: Project change recover password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/projectCreateChangeRecoveryPasswordInput'
 *     responses:
 *       201:
 *         description: Project logout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/projectChangeRecoveryPasswordResponse'
 */


/**
 * @swagger
 * /api/auth/changePassword:
 *   post:
 *     tags:
 *       - Project
 *     description: Project change recover password
 *     parameters:
 *       - in: query
 *         name: _id
 *         description: logined employee id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: adminReset
 *         description: Indicates if the password reset is initiated by an admin
 *         required: true
 *         schema:
 *           type: boolean

 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/projectCreateChangePasswordInput'
 *     responses:
 *       201:
 *         description: Project logout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/projectChangePasswordResponse'
 */