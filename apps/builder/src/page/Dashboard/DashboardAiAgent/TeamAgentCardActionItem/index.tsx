import { ShareAgentTab } from "@illa-public/invite-modal/ShareAgent/interface"
import { ShareAgentPC } from "@illa-public/invite-modal/ShareAgent/pc"
import { useUpgradeModal } from "@illa-public/upgrade-modal"
import {
  USER_ROLE,
  getCurrentTeamInfo,
  getCurrentUser,
  teamActions,
} from "@illa-public/user-data"
import {
  ACTION_MANAGE,
  ATTRIBUTE_GROUP,
  canManage,
  canUseUpgradeFeature,
} from "@illa-public/user-role-utils"
import { isCloudVersion } from "@illa-public/utils"
import { FC, MouseEvent, useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import {
  Button,
  CopyIcon,
  DeleteOutlineIcon,
  DependencyIcon,
  DropList,
  DropListItem,
  Dropdown,
  MoreIcon,
  useMessage,
  useModal,
} from "@illa-design/react"
import { dashboardTeamAiAgentActions } from "@/redux/dashboard/teamAiAgents/dashboardTeamAiAgentSlice"
import { deleteAiAgent, duplicateAiAgent } from "@/services/agent"
import { copyToClipboard } from "@/utils/eventHandlerHelper/utils/commonUtils"
import { isILLAAPiError } from "@/utils/typeHelper"

export interface AppCardActionItemProps {
  aiAgentID: string
  aiAgentName: string
  canEdit: boolean
  publishedToMarketplace: boolean
}

export const TeamAgentCardActionItem: FC<AppCardActionItemProps> = (props) => {
  const { aiAgentID, aiAgentName, canEdit, publishedToMarketplace } = props

  const currentUser = useSelector(getCurrentUser)

  const { t } = useTranslation()
  const message = useMessage()
  const modal = useModal()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { teamIdentifier } = useParams()

  const teamInfo = useSelector(getCurrentTeamInfo)!

  const upgradeModal = useUpgradeModal()
  const [shareVisible, setShareVisible] = useState(false)
  const [duplicateLoading, setDuplicateLoading] = useState(false)

  const canUseBillingFeature = canUseUpgradeFeature(
    teamInfo?.myRole,
    teamInfo?.totalTeamLicense?.teamLicensePurchased,
    teamInfo?.totalTeamLicense?.teamLicenseAllPaid,
  )

  const stopPropagation = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }

  const closeInviteModal = () => {
    setShareVisible(false)
  }

  const openInviteModal = useCallback(() => {
    if (isCloudVersion && !canUseBillingFeature) {
      upgradeModal({
        modalType: "upgrade",
      })
      return
    }
    setShareVisible(true)
  }, [canUseBillingFeature, upgradeModal])

  const handleDuplicateApp = () => {
    if (duplicateLoading) return
    setDuplicateLoading(true)
    duplicateAiAgent(aiAgentID)
      .then(
        (response) => {
          const aiAgentID = response.data.aiAgentID
          navigate(`/${teamIdentifier}/ai-agent/${aiAgentID}`)
        },
        (failure) => {
          if (isILLAAPiError(failure)) {
            message.error({
              content: t("dashboard.app.duplicate_fail"),
            })
          } else {
            message.error({
              content: t("network_error"),
            })
          }
        },
      )
      .finally(() => {
        setDuplicateLoading(false)
      })
  }

  const handleDelete = useCallback(() => {
    const modalId = modal.show({
      w: "496px",
      blockOkHide: true,
      title: t("dashboard.common.delete_title"),
      children: t("dashboard.common.delete_content"),
      cancelText: t("dashboard.common.delete_cancel_text"),
      okText: t("dashboard.common.delete_ok_text"),
      okButtonProps: {
        colorScheme: "red",
      },
      closable: false,
      onOk: () => {
        modal.update(modalId, {
          okLoading: true,
        })
        deleteAiAgent(aiAgentID)
          .then(
            () => {
              message.success({
                content: t("dashboard.app.trash_success"),
              })
              modal.close(modalId)
            },
            (error) => {
              if (isILLAAPiError(error)) {
                message.success({
                  content: t("dashboard.app.trash_failure"),
                })
              } else {
                message.error({
                  content: t("network_error"),
                })
              }
            },
          )
          .finally(() => {
            modal.update(modalId, {
              okLoading: false,
            })
          })
      },
    })
  }, [aiAgentID, modal, message, t])

  const onContributed = useCallback(
    (value: boolean) => {
      dispatch(
        dashboardTeamAiAgentActions.modifyTeamAiAgentReducer({
          aiAgentID,
          modifiedProps: {
            publishedToMarketplace: value,
          },
        }),
      )
    },
    [dispatch, aiAgentID],
  )

  return (
    <>
      <div onClick={stopPropagation}>
        {canEdit ? (
          <Dropdown
            position="bottom-end"
            trigger="click"
            triggerProps={{ closeDelay: 0, openDelay: 0 }}
            dropList={
              <DropList w="184px">
                <DropListItem
                  key="duplicate"
                  value="duplicate"
                  title={
                    <div>
                      <CopyIcon mr="8px" />
                      <span>{t("duplicate")}</span>
                    </div>
                  }
                  onClick={handleDuplicateApp}
                />
                <DropListItem
                  key="share"
                  value="share"
                  title={
                    <div>
                      <DependencyIcon mr="8px" />
                      <span>{t("share")}</span>
                    </div>
                  }
                  onClick={openInviteModal}
                />
                <DropListItem
                  key="delete"
                  value="delete"
                  title={
                    <div>
                      <DeleteOutlineIcon mr="8px" />
                      <span>{t("dashboard.common.delete")}</span>
                    </div>
                  }
                  deleted
                  onClick={handleDelete}
                />
              </DropList>
            }
          >
            <Button
              variant="text"
              colorScheme="grayBlue"
              leftIcon={<MoreIcon size="14px" />}
            />
          </Dropdown>
        ) : publishedToMarketplace ? (
          // for viewer
          <Dropdown
            position="bottom-end"
            trigger="click"
            triggerProps={{ closeDelay: 0, openDelay: 0 }}
            dropList={
              <DropList w="184px">
                <DropListItem
                  key="share"
                  value="share"
                  title={
                    <div>
                      <DependencyIcon mr="8px" />
                      <span>{t("share")}</span>
                    </div>
                  }
                  onClick={openInviteModal}
                />
              </DropList>
            }
          >
            <Button
              variant="text"
              colorScheme="grayBlue"
              leftIcon={<MoreIcon size="14px" />}
            />
          </Dropdown>
        ) : null}
      </div>
      {shareVisible && (
        <ShareAgentPC
          redirectUrl={`${import.meta.env.ILLA_BUILDER_URL}/${
            teamInfo.identifier
          }/dashboard/ai-agent?list=team`}
          onClose={() => {
            closeInviteModal()
          }}
          canInvite={canManage(
            teamInfo.myRole,
            ATTRIBUTE_GROUP.AGENT,
            ACTION_MANAGE.FORK_AGENT,
          )}
          defaultTab={ShareAgentTab.SHARE_WITH_TEAM}
          defaultInviteUserRole={USER_ROLE.VIEWER}
          teamID={teamInfo.id}
          currentUserRole={teamInfo.myRole}
          defaultBalance={teamInfo.currentTeamLicense.balance}
          defaultAllowInviteLink={teamInfo.permission.inviteLinkEnabled}
          onInviteLinkStateChange={(enableInviteLink) => {
            dispatch(
              teamActions.updateTeamMemberPermissionReducer({
                teamID: teamInfo.id,
                newPermission: {
                  ...teamInfo.permission,
                  inviteLinkEnabled: enableInviteLink,
                },
              }),
            )
          }}
          agentID={aiAgentID}
          defaultAgentContributed={publishedToMarketplace}
          onAgentContributed={(isAgentContributed) => {
            onContributed(isAgentContributed)
          }}
          onCopyInviteLink={(link) => {
            copyToClipboard(
              t("user_management.modal.custom_copy_text_agent_invite", {
                userName: currentUser.nickname,
                teamName: teamInfo.name,
                inviteLink: link,
              }),
            )
          }}
          onCopyAgentMarketLink={(link) => {
            copyToClipboard(
              t("user_management.modal.contribute.default_text.agent", {
                agentName: aiAgentName,
                agentLink: link,
              }),
            )
          }}
          userRoleForThisAgent={teamInfo.myRole}
          ownerTeamID={teamInfo.id}
          onBalanceChange={(balance) => {
            dispatch(
              teamActions.updateTeamMemberSubscribeReducer({
                teamID: teamInfo.id,
                subscribeInfo: {
                  ...teamInfo.currentTeamLicense,
                  balance: balance,
                },
              }),
            )
          }}
        />
      )}
    </>
  )
}

TeamAgentCardActionItem.displayName = "TeamAgentCardActionItem"
