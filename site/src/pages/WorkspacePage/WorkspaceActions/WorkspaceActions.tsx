import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import DuplicateIcon from "@mui/icons-material/FileCopyOutlined";
import HistoryIcon from "@mui/icons-material/HistoryOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import type { Workspace, WorkspaceBuildParameter } from "api/typesGenerated";
import { Button } from "components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "components/DropdownMenu/DropdownMenu";
import { useAuthenticated } from "hooks/useAuthenticated";
import { TrashIcon } from "lucide-react";
import { EllipsisVertical } from "lucide-react";
import {
	type ActionType,
	abilitiesByWorkspaceStatus,
} from "modules/workspaces/actions";
import { useWorkspaceDuplication } from "pages/CreateWorkspacePage/useWorkspaceDuplication";
import { type FC, Fragment, type ReactNode, useState } from "react";
import { mustUpdateWorkspace } from "utils/workspace";
import {
	ActivateButton,
	CancelButton,
	DisabledButton,
	FavoriteButton,
	RestartButton,
	StartButton,
	StopButton,
	UpdateAndRestartButton,
	UpdateAndStartButton,
	UpdateButton,
} from "./Buttons";
import { DebugButton } from "./DebugButton";
import { DownloadLogsDialog } from "./DownloadLogsDialog";
import { RetryButton } from "./RetryButton";

export interface WorkspaceActionsProps {
	workspace: Workspace;
	handleToggleFavorite: () => void;
	handleStart: (buildParameters?: WorkspaceBuildParameter[]) => void;
	handleStop: () => void;
	handleRestart: (buildParameters?: WorkspaceBuildParameter[]) => void;
	handleDelete: () => void;
	handleUpdate: () => void;
	handleCancel: () => void;
	handleSettings: () => void;
	handleChangeVersion: () => void;
	handleRetry: (buildParameters?: WorkspaceBuildParameter[]) => void;
	handleDebug: (buildParameters?: WorkspaceBuildParameter[]) => void;
	handleDormantActivate: () => void;
	isUpdating: boolean;
	isRestarting: boolean;
	children?: ReactNode;
	canChangeVersions: boolean;
	canDebug: boolean;
}

export const WorkspaceActions: FC<WorkspaceActionsProps> = ({
	workspace,
	handleToggleFavorite,
	handleStart,
	handleStop,
	handleRestart,
	handleDelete,
	handleUpdate,
	handleCancel,
	handleSettings,
	handleRetry,
	handleDebug,
	handleChangeVersion,
	handleDormantActivate,
	isUpdating,
	isRestarting,
	canChangeVersions,
	canDebug,
}) => {
	const { duplicateWorkspace, isDuplicationReady } =
		useWorkspaceDuplication(workspace);

	const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

	const { user } = useAuthenticated();
	const isOwner =
		user.roles.find((role) => role.name === "owner") !== undefined;
	const { actions, canCancel, canAcceptJobs } = abilitiesByWorkspaceStatus(
		workspace,
		{ canDebug, isOwner },
	);

	const mustUpdate = mustUpdateWorkspace(workspace, canChangeVersions);
	const tooltipText = getTooltipText(workspace, mustUpdate, canChangeVersions);

	// A mapping of button type to the corresponding React component
	const buttonMapping: Record<ActionType, ReactNode> = {
		update: <UpdateButton handleAction={handleUpdate} />,
		updateAndStart: <UpdateAndStartButton handleAction={handleUpdate} />,
		updateAndRestart: <UpdateAndRestartButton handleAction={handleUpdate} />,
		updating: <UpdateButton loading handleAction={handleUpdate} />,
		start: (
			<StartButton
				workspace={workspace}
				handleAction={handleStart}
				disabled={mustUpdate}
				tooltipText={tooltipText}
			/>
		),
		starting: (
			<StartButton
				loading
				workspace={workspace}
				handleAction={handleStart}
				disabled={mustUpdate}
				tooltipText={tooltipText}
			/>
		),
		stop: <StopButton handleAction={handleStop} />,
		stopping: <StopButton loading handleAction={handleStop} />,
		restart: (
			<RestartButton
				workspace={workspace}
				handleAction={handleRestart}
				disabled={mustUpdate}
				tooltipText={tooltipText}
			/>
		),
		restarting: (
			<RestartButton
				loading
				workspace={workspace}
				handleAction={handleRestart}
				disabled={mustUpdate}
				tooltipText={tooltipText}
			/>
		),
		deleting: <DisabledButton label="Deleting" />,
		canceling: <DisabledButton label="Canceling..." />,
		deleted: <DisabledButton label="Deleted" />,
		pending: <DisabledButton label="Pending..." />,
		activate: <ActivateButton handleAction={handleDormantActivate} />,
		activating: <ActivateButton loading handleAction={handleDormantActivate} />,
		retry: (
			<RetryButton
				handleAction={handleRetry}
				workspace={workspace}
				enableBuildParameters={workspace.latest_build.transition === "start"}
			/>
		),
		debug: (
			<DebugButton
				handleAction={handleDebug}
				workspace={workspace}
				enableBuildParameters={workspace.latest_build.transition === "start"}
			/>
		),
	};

	return (
		<div
			css={{ display: "flex", alignItems: "center", gap: 8 }}
			data-testid="workspace-actions"
		>
			{/* Restarting must be handled separately, because it otherwise would appear as stopping */}
			{isUpdating
				? buttonMapping.updating
				: isRestarting
					? buttonMapping.restarting
					: actions.map((action) => (
							<Fragment key={action}>{buttonMapping[action]}</Fragment>
						))}

			{canCancel && <CancelButton handleAction={handleCancel} />}

			<FavoriteButton
				workspaceID={workspace.id}
				isFavorite={workspace.favorite}
				onToggle={handleToggleFavorite}
			/>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						size="icon-lg"
						variant="subtle"
						aria-label="Workspace actions"
						data-testid="workspace-options-button"
						aria-controls="workspace-options"
						disabled={!canAcceptJobs}
					>
						<EllipsisVertical aria-hidden="true" />
						<span className="sr-only">Workspace actions</span>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent id="workspace-options" align="end">
					<DropdownMenuItem onClick={handleSettings}>
						<SettingsIcon />
						Settings
					</DropdownMenuItem>

					{canChangeVersions && (
						<DropdownMenuItem onClick={handleChangeVersion}>
							<HistoryIcon />
							Change version&hellip;
						</DropdownMenuItem>
					)}

					<DropdownMenuItem
						onClick={duplicateWorkspace}
						disabled={!isDuplicationReady}
					>
						<DuplicateIcon />
						Duplicate&hellip;
					</DropdownMenuItem>

					<DropdownMenuItem onClick={() => setIsDownloadDialogOpen(true)}>
						<DownloadOutlined />
						Download logs&hellip;
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						className="text-content-destructive focus:text-content-destructive"
						onClick={handleDelete}
						data-testid="delete-button"
					>
						<TrashIcon />
						Delete&hellip;
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<DownloadLogsDialog
				workspace={workspace}
				open={isDownloadDialogOpen}
				onClose={() => setIsDownloadDialogOpen(false)}
				onConfirm={() => {}}
			/>
		</div>
	);
};

function getTooltipText(
	workspace: Workspace,
	mustUpdate: boolean,
	canChangeVersions: boolean,
): string {
	if (!mustUpdate && !canChangeVersions) {
		return "";
	}

	if (
		!mustUpdate &&
		canChangeVersions &&
		workspace.template_require_active_version
	) {
		return "This template requires automatic updates on workspace startup, but template administrators can ignore this policy.";
	}

	if (workspace.automatic_updates === "always") {
		return "Automatic updates are enabled for this workspace. Modify the update policy in workspace settings if you want to preserve the template version.";
	}

	return "";
}
