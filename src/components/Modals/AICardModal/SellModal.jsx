import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Input from '~/components/Texts/Input';
import { DayPicker } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import 'react-day-picker/dist/style.css';

SellModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function SellModal({ onHide }) {
  const [selectedDay, setSelectedDay] = useState();
  const [amount, setAmount] = useState(0);
  const [selected, setSelected] = useState('fixed');
  const [errors, setErrors] = useState({});

  const footer =
    selectedDay && isValid(selectedDay) ? (
      <p>You selected {format(selectedDay, 'PPP')}.</p>
    ) : (
      <p>Please pick a day.</p>
    );

  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>List for Sale</header>
      <main>
        <FilterBar
          style={{
            height: '4.5rem',
            fontSize: '1.6rem',
            color: '#333'
          }}
        >
          <nav
            className={selected === 'fixed' ? 'active' : ''}
            onClick={() => {
              setSelected('fixed');
            }}
          >
            Fixed Price
          </nav>
          <nav
            className={selected === 'timed' ? 'active' : ''}
            onClick={() => {
              setSelected('timed');
            }}
          >
            Timed Auction
          </nav>
        </FilterBar>
        {selected === 'fixed' ? (
          <div>
            <p
              style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#333' }}
            >
              Set a price
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '1rem'
              }}
            >
              <div
                style={{
                  padding: '0.5rem 1rem',
                  marginRight: '1rem',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              >
                floor price goes here.
              </div>
              <div
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              >
                recommended price goes here.
              </div>
            </div>
            <Input
              onChange={handleAmountChange}
              placeholder="Amount"
              value={amount}
              error={errors.amount}
              style={{
                fontSize: '1.4rem',
                padding: '0.5rem 1rem',
                border: '1px solid #333',
                borderRadius: '4px',
                marginTop: '1rem'
              }}
            />
            <p
              style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#333',
                marginTop: '1rem'
              }}
            >
              Set duration
            </p>
            <div
              style={{
                display: 'flex',
                width: '100%',
                marginTop: '1rem'
              }}
            >
              <div
                style={{
                  width: '50%',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '1.4rem', marginRight: '1rem' }}>
                  from:
                </span>
                <DayPicker
                  mode="single"
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  footer={footer}
                />
              </div>
              <div style={{ marginLeft: '2rem' }}>
                <span style={{ fontSize: '1.4rem', margin: '0 1rem' }}>
                  to:
                </span>
                <DayPicker
                  mode="single"
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  footer={footer}
                />
              </div>
            </div>
            <p
              style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#333',
                marginTop: '1rem'
              }}
            >
              Summary
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '1rem'
              }}
            >
              <p style={{ fontSize: '1.4rem', marginRight: '1rem' }}>
                Listing price:{' '}
              </p>
              <p style={{ fontSize: '1.4rem' }}>
                {/*listing price goes here*/}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '1rem'
              }}
            >
              <p style={{ fontSize: '1.4rem', marginRight: '1rem' }}>Fees: </p>
              <p style={{ fontSize: '1.4rem' }}>{/*fee goes here*/}</p>
            </div>
            <p
              style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#333',
                marginTop: '1rem'
              }}
            >
              Total potential Earnings
            </p>
            <p style={{ fontSize: '1.4rem', marginTop: '1rem' }}>
              {/*earnings goes here*/}
            </p>
            <Button
              filled
              onClick={handleCompleteListing}
              style={{
                fontSize: '1.4rem',
                padding: '0.5rem 1rem',
                marginTop: '1rem'
              }}
            >
              Complete listing
            </Button>
          </div>
        ) : (
          <div>auction menu goes here</div>
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  function handleAmountChange(amount) {
    amount.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setAmount(amount);
    setErrors({
      ...errors,
      amount: amount === '' ? 'Please enter a valid amount.' : ''
    });
  }

  function handleCompleteListing() {
    let hasErrors = false;

    if (amount === '') {
      setErrors({ ...errors, amount: 'Please enter a valid amount.' });
      hasErrors = true;
    }

    if (!hasErrors) {
      // Calculate listing price and duration using values of `amount`, `startDate`, and `endDate`
      // Create the listing
    }
  }
}
