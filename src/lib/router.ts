export type Route =
  | { name: 'auth' }
  | { name: 'home' }
  | { name: 'activity' }
  | { name: 'messages' }
  | { name: 'jobs' }
  | { name: 'me' }
  | { name: 'search' }
  | { name: 'search_results'; query?: string }
  | { name: 'job_details'; jobId: string }
  | { name: 'saved_jobs' }
  | { name: 'saved_profiles' }
  | { name: 'applications' }
  | { name: 'application_detail'; applicationId: string }
  | { name: 'active_work' }
  | { name: 'active_work_detail'; workId: string }
  | { name: 'completed_work' }
  | { name: 'completed_work_detail'; workId: string }
  | { name: 'work_history' }
  | { name: 'conversation'; conversationId: string; otherUserId?: string; jobId?: string; applicationId?: string }
  | { name: 'notifications' }
  | { name: 'profile' }
  | { name: 'edit_profile' }
  | { name: 'verification' }
  | { name: 'verification_details' }
  | { name: 'settings' }
  | { name: 'account' }
  | { name: 'privacy_security' }
  | { name: 'blocked_users' }
  | { name: 'help' }
  | { name: 'report_problem' }
  | { name: 'menu' }
  | { name: 'create_requirement' }
  | { name: 'who_do_you_need' }
  | { name: 'work_details'; draftId: string }
  | { name: 'timings_duration'; draftId: string }
  | { name: 'payment'; draftId: string }
  | { name: 'review_requirement'; draftId: string }
  | { name: 'posted_success'; jobId: string }
  | { name: 'manage_posts' }
  | { name: 'applicants'; jobId: string }
  | { name: 'applicant_profile'; applicationId: string }
  | { name: 'create_business' }
  | { name: 'review'; completedWorkId: string }
  | { name: 'admin' }
  | { name: 'admin_users' }
  | { name: 'admin_jobs' }
  | { name: 'admin_reports' }
  | { name: 'admin_verification' }
  | { name: 'profile_view'; userId: string };

interface RouterState {
  stack: Route[];
  tabIndex: number;
}

type Listener = (route: Route, stack: Route[], tabIndex: number) => void;

class Router {
  private state: RouterState = {
    stack: [{ name: 'home' }],
    tabIndex: 0,
  };
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.current(), this.state.stack, this.state.tabIndex);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const route = this.current();
    this.listeners.forEach((l) => l(route, this.state.stack, this.state.tabIndex));
  }

  current(): Route {
    return this.state.stack[this.state.stack.length - 1];
  }

  getStack(): Route[] {
    return this.state.stack;
  }

  getTabIndex(): number {
    return this.state.tabIndex;
  }

  navigate(route: Route) {
    this.state.stack = [...this.state.stack, route];
    this.notify();
  }

  switchTab(index: number) {
    const tabRoutes: Route[] = [
      { name: 'home' },
      { name: 'activity' },
      { name: 'messages' },
      { name: 'jobs' },
      { name: 'me' },
    ];
    this.state.tabIndex = index;
    this.state.stack = [tabRoutes[index]];
    this.notify();
  }

  goBack() {
    if (this.state.stack.length > 1) {
      this.state.stack = this.state.stack.slice(0, -1);
      this.notify();
    }
  }

  goHome() {
    this.state.stack = [{ name: 'home' }];
    this.state.tabIndex = 0;
    this.notify();
  }

  canGoBack(): boolean {
    return this.state.stack.length > 1;
  }
}

export const router = new Router();
