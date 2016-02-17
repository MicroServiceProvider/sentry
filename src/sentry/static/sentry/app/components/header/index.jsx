import React from 'react';
import $ from 'jquery';

import ApiMixin from '../../mixins/apiMixin';
import ConfigStore from '../../stores/configStore';
import OrganizationState from '../../mixins/organizationState';
import {Link} from 'react-router';

import Broadcasts from './broadcasts';
import StatusPage from './statuspage';
import UserNav from './userNav';
import requiredAdminActions from '../requiredAdminActions';
import OrganizationSelector from './organizationSelector';
import TodoList from '../todos';
import {t} from '../../locale';

const OnboardingStatus = React.createClass({
  propTypes: {
    org: React.PropTypes.object.isRequired,
    onToggleTodos: React.PropTypes.func.isRequired,
    showTodos: React.PropTypes.bool,
    onHideTodos: React.PropTypes.func,
  },

  render() {
    let org = this.props.org;
    if (org.features.indexOf('onboarding') === -1)
      return null;

    let percentage = Math.round(
      ((org.onboardingTasks || []).filter(
        t => t.status === 'complete' || t.status === 'skipped'
      ).length) / TodoList.TASKS.length * 100
    ).toString();
    let style = {
      width: percentage + '%',
    };

    return (
      <div className="onboarding-progress-bar" onClick={this.props.onToggleTodos}>
        <div className="slider" style={style} ></div>
        {this.props.showTodos &&
          <div className="dropdown-menu"><TodoList onClose={this.props.onHideTodos} /></div>
        }
      </div>
    );
  }
});

const Header = React.createClass({
  propTypes: {
    orgId: React.PropTypes.string.isRequired
  },

  mixins: [ApiMixin, OrganizationState],

  getInitialState: function() {
    if (location.hash == '#welcome') {
      return {showTodos: true};
    } else {
      return {showTodos: false};
    }
  },

  componentDidMount() {
    $(window).on('hashchange', this.hashChangeHandler);
  },

  componentWillUnmount() {
    $(window).off('hashchange', this.hashChangeHandler);
  },

  hashChangeHandler() {
    if (location.hash == '#welcome') {
      this.setState({showTodos: true});
    }
  },

  toggleTodos(e) {
    this.setState({showTodos: !this.state.showTodos});
  },

  render() {
    let user = ConfigStore.get('user');
    let org = this.getOrganization();
    let logo;

    if (user) {
      logo = <span className="icon-sentry-logo"/>;
    } else {
      logo = <span className="icon-sentry-logo-full"/>;
    }

    let actionMessage = null;

    if (org) {
      let requiredActions = org.requiredAdminActions;
      if (requiredActions.length > 0) {
        if (this.getAccess().has('org:write')) {
          let slugId = requiredActions[0].toLowerCase().replace(/_/g, '-');
          let url = `/organizations/${org.slug}/actions/${slugId}/`;
          actionMessage = (
            <a href={url}>{t('Required Action:')}{' '}{
              requiredAdminActions[requiredActions[0]].getActionLinkTitle()}</a>
          );
        } else {
          actionMessage = (
            <span>{t('There are pending actions for an administrator of this organization!')}</span>
          );
        }
      }
    }

    // NOTE: this.props.orgId not guaranteed to be specified
    return (
      <header>
        <div className="container">
          <UserNav className="pull-right" />
          <Broadcasts className="pull-right" />
          {this.props.orgId ?
            <Link to={`/${this.props.orgId}/`} className="logo">{logo}</Link>
            :
            <a href="/" className="logo">{logo}</a>
          }
          <OrganizationSelector organization={org} className="pull-right" />

          <StatusPage className="pull-right" />
          {org &&
            <OnboardingStatus org={org} showTodos={this.state.showTodos}
                              onShowTodos={this.setState.bind(this, {showTodos: false})}
                              onToggleTodos={this.toggleTodos}
                              onHideTodos={this.setState.bind(this, {showTodos: false})} />
          }
          {actionMessage ?
            <span className="admin-action-message">{actionMessage}</span>
            : null}
        </div>
      </header>
    );
  }
});

export default Header;
