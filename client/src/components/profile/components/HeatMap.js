import React from 'react';
import PropTypes from 'prop-types';
import CalendarHeatMap from 'react-calendar-heatmap';
import ReactTooltip from 'react-tooltip';
import addDays from 'date-fns/add_days';
import addMonths from 'date-fns/add_months';
import startOfDay from 'date-fns/start_of_day';
import format from 'date-fns/format';

import FullWidthRow from '../../helpers/FullWidthRow';
import Spacer from '../../helpers/Spacer';

import 'react-calendar-heatmap/dist/styles.css';
import './heatmap.css';

const propTypes = {
  calendar: PropTypes.object,
  streak: PropTypes.shape({
    current: PropTypes.number,
    longest: PropTypes.number
  })
};

function HeatMap({ calendar, streak }) {
  // an issue with react-calendar-heatmap makes the days off by one
  // see this https://github.com/kevinsqi/react-calendar-heatmap/issues/112
  // I have added one day in the marked places to account for the offset

  // this logic adds a day to all the timestamps (remove is issue gets fixed)
  let tempCalendar = {};
  const secondsInADay = 60 * 60 * 24;
  for (let timestamp in calendar) {
    if (timestamp) {
      tempCalendar[parseInt(timestamp, 10) + secondsInADay] = 1;
    }
  }
  calendar = tempCalendar;

  // the addDays of 1 to startOfToday (remove if issue gets fixed)
  const startOfToday = addDays(startOfDay(Date.now()), 1);
  const sixMonthsAgo = addMonths(startOfToday, -6);
  const startOfCalendar = format(addDays(sixMonthsAgo, -1), 'YYYY-MM-DD');
  const endOfCalendar = format(startOfToday, 'YYYY-MM-DD');

  let calendarData = {};
  let dayCounter = sixMonthsAgo;

  while (dayCounter <= startOfToday) {
    calendarData[format(dayCounter, 'YYYY-MM-DD')] = 0;
    dayCounter = addDays(dayCounter, 1);
  }

  for (let timestamp in calendar) {
    if (calendar.hasOwnProperty(timestamp)) {
      timestamp = Number(timestamp * 1000) || null;
      if (timestamp) {
        const startOfTimestampDay = format(startOfDay(timestamp), 'YYYY-MM-DD');
        calendarData[startOfTimestampDay] =
          calendarData[startOfTimestampDay] + 1 || 1;
      }
    }
  }

  // create an object in the format needed for react-calendar-heatmap
  const calendarValues = Object.keys(calendarData).map(key => ({
    date: key,
    count: calendarData[key]
  }));

  return (
    <FullWidthRow>
      <FullWidthRow>
        <CalendarHeatMap
          classForValue={value => {
            if (!value || value.count < 1) return 'color-empty';
            if (value.count < 4) return 'color-scale-1';
            if (value.count < 8) return 'color-scale-2';
            if (value.count >= 8) return 'color-scale-a-lot';
            return 'color-empty';
          }}
          endDate={endOfCalendar}
          startDate={startOfCalendar}
          tooltipDataAttrs={value => {
            let valueCount;
            if (value && value.count === 1) {
              valueCount = '1 point';
            } else if (value && value.count > 1) {
              valueCount = `${value.count} points`;
            } else {
              valueCount = 'No points';
            }
            return {
              'data-tip': `<b>${valueCount}</b> on ${new Date(
                value.date
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}`
            };
          }}
          values={calendarValues}
        />
        <ReactTooltip className='react-tooltip' effect='solid' html={true} />
      </FullWidthRow>
      <Spacer />
      <FullWidthRow>
        <div className='streak-container'>
          <span className='streak'>
            <b>Longest Streak:</b> {streak.longest || 0}
          </span>
          <span className='streak'>
            <b>Current Streak:</b> {streak.current || 0}
          </span>
        </div>
      </FullWidthRow>
      <Spacer />
      <hr />
    </FullWidthRow>
  );
}

HeatMap.displayName = 'HeatMap';
HeatMap.propTypes = propTypes;

export default HeatMap;
