const express = require("express");
const router = express.Router();
const CommenController = require("../../controllers/workspaceControllers/commenController");
const Middelwares = require("../../middelwares/authMiddelware");
const uploadMiddleware = require("../../middelwares/uploadMiddleware");
const uploadOnS3Middleware = require("../../middelwares/uploadOnS3Middleware");
const {
  uploadCSVMiddleware,
  uploadDataCsv,
} = require("../../middelwares/uploadCSVMiddleware");

router.get("/dashboard", Middelwares.auth, CommenController.dashboard);
router.post(
  "/upload",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("file"),
  CommenController.uploadFile
);

router.put(
  "/update-password",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updatePassword
);
router.get(
  "/buy-subscription-plans",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.buysubscriptionPlans
);

router.put(
  "/edit-essentials",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("image"),
  CommenController.editEssentials
);

//====================================== Update-Profile-Tanant ===========================
router.put(
  "/edit-details",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editDetails
);

router.put(
  "/edit-address",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editAddress
);

router.put(
  "/edit-account-details",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editAccountDetails
);

router.put(
  "/edit-documents",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.any(),
  CommenController.editDocuments
);

router.put(
  "/edit-profile-description",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editProfileDescription
);

router.put(
  "/edit-private-notes",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editPrivateNotes
);

router.put(
  "/edit-social",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editSocial
);

router.put(
  "/edit-localization",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editLocalization
);

router.put(
  "/edit-localization",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editLocalization
);

router.put(
  "/edit-permissions",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editPermissions
);
router.put(
  "/edit-preferences",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editPreferences
);
router.get(
  "/profile",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getProfile
);
router.post(
  "/verify-token",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.verifyToken
);
//====================================== Tanant-Company-Flow ===========================
router.post(
  "/create-company",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("companyLogo"),
  CommenController.createCompany
);

router.get(
  "/get-companies",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getCompanies
);

router.put(
  "/edit-company",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("companyLogo"),
  CommenController.updateCompany
);

router.put(
  "/edit-tag-company",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateTagCompany
);

router.put(
  "/edit-company-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateCompanyField
);

router.delete(
  "/delete-company",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteCompany
);

//====================================== Update-Profile-Tanant ===========================
router.put(
  "/edit-company-essentials",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("companyLogo"),
  CommenController.editCompanyEssentials
);

router.put(
  "/edit-company-address",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editCompanyAddress
);

router.put(
  "/edit-company-profile-description",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editCompanyProfileDescription
);

router.put(
  "/edit-company-private-notes",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editCompanyPrivateNotes
);
router.put(
  "/edit-company-custom-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editCompanyCustomField
);

//====================================== Tanant-People-Flow ===========================
router.get(
  "/get-roles",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getRoles
);

router.post(
  "/add-people",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.any(),
  CommenController.createPeople
);
router.post(
  "/resend-invite",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.resendInvite
);

router.post(
  "/people-complete-setup",
  Middelwares.originAuth,
  uploadOnS3Middleware.any(),
  CommenController.peopleCompleteSetup
);

router.get(
  "/get-invite-people-details",
  Middelwares.originAuth,
  CommenController.getInvitePeopleDetails
);

router.get(
  "/get-people",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getPeople
);

router.put(
  "/edit-people",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.any(),
  CommenController.editPeople
);

router.delete(
  "/delete-people",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deletePeople
);

router.put(
  "/active-deactive-people",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.activeDeactivePeople
);

router.post(
  "/add-skill",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createSkill
);

router.get(
  "/get-skills",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getSkills
);

router.put(
  "/edit-skill",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateSkill
);

router.post(
  "/add-user-skill",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createUserSkill
);

router.get(
  "/get-user-skill",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getUsersGroupedBySkills
);

router.put(
  "/edit-user-skill",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateUserSkill
);

router.delete(
  "/delete-skill",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteUserSkill
);

router.post(
  "/add-team",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("teamLogo"),
  CommenController.createTeam
);

router.get(
  "/get-team-users",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getUsersGroupedByTeams
);

router.put(
  "/edit-team",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("teamLogo"),
  CommenController.updateTeam
);

router.delete(
  "/delete-team",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteUserteam
);

//====================================== Tanant-designation-Flow ===========================
router.post(
  "/add-designation",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createDesignation
);

router.get(
  "/get-designation",
  Middelwares.originAuth,
  CommenController.getDesignation
);

router.put(
  "/edit-designation",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateDesignation
);

router.delete(
  "/delete-designation",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteDesignation
);

//====================================== Tanant-designation-Multi-User-Flow ===========================
router.post(
  "/add-multi-people-designation",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createMultiPeopleDesignation
);

router.get(
  "/get-multi-people-designation",
  Middelwares.originAuth,
  CommenController.getMultiPeopleDesignations
);

router.put(
  "/edit-multi-people-designation",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateMultiPeopleDesignation
);

router.delete(
  "/delete-multi-people-designation",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteMultiPeopleDesignation
);

//====================================== Tanant-Activity-And-History-Flow ===========================
router.get(
  "/get-ativity",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getActivity
);

//====================================== Tanant-Setting-Flow ===========================
router.get(
  "/get-workspace",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getWorkspaceDetails
);

router.put(
  "/edit-workspace",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateGeneralDetails
);

router.put(
  "/edit-workspace-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateGeneralField
);

router.put(
  "/edit-workspace-domain",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateWorkspaceDomain
);

router.put(
  "/edit-workspace-logo",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("workspaceLogo"),
  CommenController.updateWorkspaceLogo
);

router.put(
  "/edit-workspace-fav-icon",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("workspaceFavIcon"),
  CommenController.updateWorkspaceFavIcon
);

router.put(
  "/edit-workspace-check-name",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateWorkspaceCheckName
);

router.put(
  "/edit-workspace-email-settings",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateWorkspaceEmailSettings
);

//====================================== Tanant-Tages-Flow ===========================
router.post(
  "/add-tag",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createTag
);

router.get(
  "/get-tags",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getTags
);

router.put(
  "/edit-tag",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateTag
);

router.delete(
  "/delete-tag",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteTag
);

//====================================== Tanant-company-Custom-Fields-Flow ===========================
router.post(
  "/add-custom-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createCustomField
);

router.get(
  "/all-custom-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getCustomField
);

router.put(
  "/edit-custom-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateCustomField
);

router.delete(
  "/delete-custom-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteCustomField
);

//====================================== Tanant-Workflow-Flow ===========================
router.post(
  "/add-workflow",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createWorkflow
);

router.get(
  "/all-workflow",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getWorkflow
);

router.put(
  "/edit-workflow",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateWorkflow
);

router.put(
  "/edit-workflow-add-peoject",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateWorkflowAddProject
);

router.delete(
  "/delete-workflow",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteWorkflow
);

//====================================== Tanant-Project-Flow ===========================
router.post(
  "/add-project-category",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createProjectCategory
);

router.get(
  "/all-project-category",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getProjectCategories
);

router.post(
  "/add-project",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createProject
);

router.put(
  "/edit-project",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateProject
);

router.delete(
  "/delete-project",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteProject
);

router.get(
  "/restore-project",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.restoreProject,
);

router.post(
  "/copy-project",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.copyProject,
);

router.put(
  "/edit-project-tag",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateProjectTags
);

router.get(
  "/all-project",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getAllProject
);

router.put(
  "/edit-project-custom-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editProjectCustomField
);

router.put(
  "/edit-project-budget",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editProjectBudget
);

router.put(
  "/edit-project-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateProjectField
);

router.post(
  "/add-project-link",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createProjectLink
);

router.get(
  "/all-project-link",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getAllProjectLink
);

router.put(
  "/edit-project-link",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateProjectLink
);

router.delete(
  "/delete-project-link",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteProjectLink
);

router.post(
  "/add-project-message",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.createProjectMessage
);

router.get(
  "/all-project-message",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getAllProjectMessage
);

router.put(
  "/edit-project-message",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.updateProjectMessage
);

router.put(
  "/edit-project-message-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("value", 10000),
  CommenController.updateProjectMessageField,
);

router.delete(
  "/delete-project-message",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteProjectMessage
);

router.post(
  "/add-project-files",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.createProjectFiles
);

router.get(
  "/all-project-files",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getAllProjectFiles
);

router.put(
  "/edit-project-file",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("file"),
  CommenController.updateProjectFile
);

router.put(
  "/edit-project-file-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateProjectFileField
);

router.put(
  "/edit-project-file-detials",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("file"),
  CommenController.updateProjectFileDetails
);

router.delete(
  "/delete-project-file",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteProjectFile
);

router.post(
  "/add-proof",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("file"),
  CommenController.createProof
);

router.get(
  "/all-proof",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getAllProof
);

router.put(
  "/edit-proof",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.single("file"),
  CommenController.updateProof
);

router.delete(
  "/delete-proof",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteProof
);


router.post(
  "/add-comment-reply",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.createCommentReply,
);

router.get(
  "/all-comment-reply",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getAllCommentReply,
);

router.put(
  "/edit-comment-reply",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.updateCommentReply,
);

router.delete(
  "/delete-comment-reply",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteCommentReply,
);

router.get(
  "/per-project-people",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getPerProjectPeople
);

router.put(
  "/remove-people-project",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.removePeopleProject
);

router.post(
  "/add-project-update",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createProjectUpdate,
);

router.get(
  "/all-project-update",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getAllProjectUpdate,
);

router.put(
  "/edit-project-update",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateProjectUpdate,
);

router.put(
  "/project-update-reaction",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.projectUpdateReaction, 
);

router.put(
  "/project-update-reaction-remove",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.projectUpdateReactionRemove,
);

router.delete(
  "/delete-project-update",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteProjectUpdate
);

//====================================== Tanant-Task-Flow ===========================
router.post(
  "/add-task-list",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createTaskList
);

router.get(
  "/all-task-list",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getAllTaskList
);

router.put(
  "/edit-task-list",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateTaskList
);

router.delete(
  "/delete-task-list",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteTaskList
);

router.post(
  "/add-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.createTask
);

router.get(
  "/all-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getAllTask
);

router.get(
  "/my-work",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getMyWork,
);

router.get(
  "/view-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getViewTask
);

router.put(
  "/edit-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.updateTask
);

router.put(
  "/edit-task-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("value", 10000),
  CommenController.updateTaskField
);

router.put(
  "/remove-file-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.removeFileTask
);

router.put(
  "/edit-task-custom-field",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.editTaskCustomField
);

router.put(
  "/edit-task-tag",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateTaskTags
);

router.delete(
  "/delete-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteTask
);

router.post(
  "/add-task-dependency",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createTaskDependency
);

router.put(
  "/edit-task-dependency",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateTaskDependency
);

router.delete(
  "/delete-task-dependency",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteTaskDependency
);

router.post(
  "/add-comment-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.createCommentTask
);

router.put(
  "/edit-comment-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.updateCommentTask
);

router.put(
  "/edit-field-comment-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.updateTaskCommentField
);

router.put(
  "/mark-all-comment-read",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.markAllTaskCommentsRead
);

router.delete(
  "/delete-task-comment",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.deleteTaskComment
);

router.post(
  "/add-sub-task",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  uploadOnS3Middleware.array("files", 10000),
  CommenController.createSubTask
);

router.get(
  "/project-all-task-comments",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getProjectAllTaskComments
);
router.get(
  "/agents",
  Middelwares.originAuth,
  // Middelwares.siteAuth,
  CommenController.agents
);

router.post(
  "/task-log-timer",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.createTaskLogTimer
);
router.use((req, res, next) => {
  res
    .status(504)
    .json({ success: false, msg: ["Site Commen Invalid Routes!"] });
});

module.exports = router;
