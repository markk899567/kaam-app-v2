import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useRoute } from '@/lib/useRoute';
import { router } from '@/lib/router';
import { Loading } from '@/components/States';
import { BottomNav } from '@/components/BottomNav';
import { AuthScreen } from '@/screens/AuthScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { JobDetailsScreen } from '@/screens/JobDetailsScreen';
import { JobsScreen } from '@/screens/JobsScreen';
import { ActivityScreen, ApplicationsScreen, ApplicationDetailScreen, ActiveWorkScreen, ActiveWorkDetailScreen, CompletedWorkScreen, WorkHistoryScreen } from '@/screens/ActivityScreen';
import { MessagesScreen, ConversationScreen } from '@/screens/MessagesScreen';
import { MeScreen } from '@/screens/MeScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { ProfileScreen, EditProfileScreen, SavedJobsScreen, SavedProfilesScreen, VerificationScreen, VerificationDetailsScreen } from '@/screens/ProfileScreens';
import { SettingsScreen, AccountScreen, PrivacySecurityScreen, BlockedUsersScreen, HelpScreen } from '@/screens/SettingsScreens';
import { CreateBusinessScreen, CreateRequirementScreen, WhoDoYouNeedScreen, WorkDetailsScreen, TimingsDurationScreen, PaymentScreen, ReviewRequirementScreen, PostedSuccessScreen, ManagePostsScreen, ApplicantsScreen, ApplicantProfileScreen, ReviewScreen, ProfileViewScreen, MenuScreen } from '@/screens/EmployerScreens';
import { AdminScreen, AdminUsersScreen, AdminJobsScreen, AdminReportsScreen, AdminVerificationScreen } from '@/screens/AdminScreens';

const TAB_SCREENS = ['home', 'activity', 'messages', 'jobs', 'me'];

function ScreenRenderer() {
  const { route, tabIndex } = useRoute();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loading message="Loading Kaam..." />
      </div>
    );
  }

  // Render the screen based on route
  let screen: React.ReactNode;
  const isTabScreen = TAB_SCREENS.includes(route.name);

  switch (route.name) {
    case 'auth':
      screen = <AuthScreen />;
      break;
    case 'home':
      screen = <HomeScreen />;
      break;
    case 'activity':
      screen = <ActivityScreen />;
      break;
    case 'messages':
      screen = <MessagesScreen />;
      break;
    case 'jobs':
      screen = <JobsScreen />;
      break;
    case 'me':
      screen = <MeScreen />;
      break;
    case 'search':
      screen = <SearchScreen />;
      break;
    case 'search_results':
      screen = <SearchScreen />;
      break;
    case 'job_details':
      screen = <JobDetailsScreen jobId={route.jobId} />;
      break;
    case 'saved_jobs':
      screen = <SavedJobsScreen />;
      break;
    case 'saved_profiles':
      screen = <SavedProfilesScreen />;
      break;
    case 'applications':
      screen = <ApplicationsScreen />;
      break;
    case 'application_detail':
      screen = <ApplicationDetailScreen applicationId={route.applicationId} />;
      break;
    case 'active_work':
      screen = <ActiveWorkScreen />;
      break;
    case 'active_work_detail':
      screen = <ActiveWorkDetailScreen workId={route.workId} />;
      break;
    case 'completed_work':
      screen = <CompletedWorkScreen />;
      break;
    case 'completed_work_detail':
      screen = <CompletedWorkScreen />;
      break;
    case 'work_history':
      screen = <WorkHistoryScreen />;
      break;
    case 'conversation':
      screen = <ConversationScreen conversationId={route.conversationId} otherUserId={route.otherUserId} />;
      break;
    case 'notifications':
      screen = <NotificationsScreen />;
      break;
    case 'profile':
      screen = <ProfileScreen />;
      break;
    case 'edit_profile':
      screen = <EditProfileScreen />;
      break;
    case 'verification':
      screen = <VerificationScreen />;
      break;
    case 'verification_details':
      screen = <VerificationDetailsScreen />;
      break;
    case 'settings':
      screen = <SettingsScreen />;
      break;
    case 'account':
      screen = <AccountScreen />;
      break;
    case 'privacy_security':
      screen = <PrivacySecurityScreen />;
      break;
    case 'blocked_users':
      screen = <BlockedUsersScreen />;
      break;
    case 'help':
      screen = <HelpScreen />;
      break;
    case 'menu':
      screen = <MenuScreen />;
      break;
    case 'create_business':
      screen = <CreateBusinessScreen />;
      break;
    case 'create_requirement':
      screen = <CreateRequirementScreen />;
      break;
    case 'who_do_you_need':
      screen = <WhoDoYouNeedScreen draftId={route.draftId} />;
      break;
    case 'work_details':
      screen = <WorkDetailsScreen draftId={route.draftId} />;
      break;
    case 'timings_duration':
      screen = <TimingsDurationScreen draftId={route.draftId} />;
      break;
    case 'payment':
      screen = <PaymentScreen draftId={route.draftId} />;
      break;
    case 'review_requirement':
      screen = <ReviewRequirementScreen draftId={route.draftId} />;
      break;
    case 'posted_success':
      screen = <PostedSuccessScreen jobId={route.jobId} />;
      break;
    case 'manage_posts':
      screen = <ManagePostsScreen />;
      break;
    case 'applicants':
      screen = <ApplicantsScreen jobId={route.jobId} />;
      break;
    case 'applicant_profile':
      screen = <ApplicantProfileScreen applicationId={route.applicationId} />;
      break;
    case 'review':
      screen = <ReviewScreen completedWorkId={route.completedWorkId} />;
      break;
    case 'profile_view':
      screen = <ProfileViewScreen userId={route.userId} />;
      break;
    case 'admin':
      screen = <AdminScreen />;
      break;
    case 'admin_users':
      screen = <AdminUsersScreen />;
      break;
    case 'admin_jobs':
      screen = <AdminJobsScreen />;
      break;
    case 'admin_reports':
      screen = <AdminReportsScreen />;
      break;
    case 'admin_verification':
      screen = <AdminVerificationScreen />;
      break;
    default:
      screen = <HomeScreen />;
  }

  // Show bottom nav for tab screens (but not conversation, which has its own layout)
  const showBottomNav = isTabScreen && route.name !== 'conversation';

  return (
    <>
      <div key={route.name + ('jobId' in route ? route.jobId : '') + ('applicationId' in route ? route.applicationId : '') + ('conversationId' in route ? route.conversationId : '') + ('draftId' in route ? route.draftId : '')} className="animate-fade-in">
        {screen}
      </div>
      {showBottomNav && <BottomNav activeTab={tabIndex} />}
    </>
  );
}

function AppContent() {
  const { user } = useAuth();
  const { route } = useRoute();

  // If not authenticated, show auth screen
  if (!user && route.name !== 'auth') {
    return <AuthScreen />;
  }

  return <ScreenRenderer />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
