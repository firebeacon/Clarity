// Copyright (C) 2026 Gregory Dott
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

exports.validateUserInput = (data) => {
  const errors = {};
  if (!data.username || data.username.trim() === '') {
    errors.username = 'Username is required';
  }
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  }
  if (!data.password || data.password.length < 9) {
    errors.password = 'Password must be at least 9 characters long';
  } else if (!/[A-Z]/.test(data.password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  } else if (!/[0-9]/.test(data.password)) {
    errors.password = 'Password must contain at least one number';
  } else if (!/[^A-Za-z0-9]/.test(data.password)) {
    errors.password = 'Password must contain at least one special character';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

exports.validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};
