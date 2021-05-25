import React from 'react';
import { navigate } from 'gatsby';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { withTranslation } from 'react-i18next';

import CertificationIcon from '../../../assets/icons/CertificationIcon';
import GreenPass from '../../../assets/icons/GreenPass';
import GreenNotCompleted from '../../../assets/icons/GreenNotCompleted';
import { certificatesByNameSelector } from '../../../redux';
import { CurrentCertType, UserType } from '../../../redux/propTypes';
import { certMap } from '../../../resources/certAndProjectMap';
import {
  certSlugTypeMap,
  superBlockCertTypeMap
} from '../../../../../config/certification-settings';
import CertificationCard from './CertificationCard';

type PropTypes = {
  currentCerts: CurrentCertType[];
  isSignedIn: boolean;
  superBlock: string;
  t: () => void;
  title: string;
  user: UserType;
};

const mapStateToProps = (state, props) => {
  return createSelector(
    certificatesByNameSelector(props.user.username),
    ({ currentCerts }) => ({
      currentCerts
    })
  )(state, props);
};

export const CertChallenge = (props: PropTypes): JSX.Element => {
  const {
    isSignedIn,
    superBlock,
    t,
    title,
    user: { username },
    currentCerts
  } = props;

  const cert = certMap.find(x => x.title === title);
  const isCertified = currentCerts.find(
    cert => certSlugTypeMap[cert.certSlug] === superBlockCertTypeMap[superBlock]
  ).show;
  const certLocation = `/certification/${username}/${cert.certSlug}`;
  const certCheckmarkStyle = { height: '40px', width: '40px' };
  const i18nSuperBlock = t(`intro:${superBlock}.title`);
  const i18nCertText = t(`intro:misc-text.certification`, {
    cert: i18nSuperBlock
  });
  const { certSlug } = cert;

  return (
    <div className='block'>
      {isSignedIn && !isCertified && (
        <CertificationCard
          certSlug={certSlug}
          i18nCertText={i18nCertText}
          superBlock={superBlock}
        />
      )}
      <button
        className={`map-cert-title ${
          isCertified ? 'map-is-cert' : 'no-cursor'
        }`}
        onClick={isCertified ? () => navigate(certLocation) : null}
      >
        <CertificationIcon />
        <h3>{i18nCertText}</h3>
        <div className='map-title-completed-big'>
          <span>
            {isCertified ? (
              <GreenPass style={certCheckmarkStyle} />
            ) : (
              <GreenNotCompleted style={certCheckmarkStyle} />
            )}
          </span>
        </div>
      </button>
    </div>
  );
};

CertChallenge.displayName = 'CertChallenge';

export default connect(mapStateToProps)(withTranslation()(CertChallenge));
