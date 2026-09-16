/**
 * Shared utility helper to resolve a clean contact display name.
 */

export const getContactName = (sender?: any): string => {
  if (!sender) return 'Unknown Contact';
  if (typeof sender.name === 'string' && sender.name.trim()) return sender.name.trim();
  if (typeof sender.available_name === 'string' && sender.available_name.trim()) return sender.available_name.trim();
  if (typeof sender.availableName === 'string' && sender.availableName.trim()) return sender.availableName.trim();
  if (sender.additional_attributes?.name && typeof sender.additional_attributes.name === 'string' && sender.additional_attributes.name.trim()) {
    return sender.additional_attributes.name.trim();
  }
  if (sender.additionalAttributes?.name && typeof sender.additionalAttributes.name === 'string' && sender.additionalAttributes.name.trim()) {
    return sender.additionalAttributes.name.trim();
  }
  if (sender.custom_attributes?.name && typeof sender.custom_attributes.name === 'string' && sender.custom_attributes.name.trim()) {
    return sender.custom_attributes.name.trim();
  }
  if (sender.customAttributes?.name && typeof sender.customAttributes.name === 'string' && sender.customAttributes.name.trim()) {
    return sender.customAttributes.name.trim();
  }
  if (typeof sender.phone_number === 'string' && sender.phone_number.trim()) return sender.phone_number.trim();
  if (typeof sender.phoneNumber === 'string' && sender.phoneNumber.trim()) return sender.phoneNumber.trim();
  if (typeof sender.email === 'string' && sender.email.trim()) return sender.email.trim();
  if (typeof sender.identifier === 'string' && sender.identifier.trim()) return sender.identifier.trim();
  return 'Unknown Contact';
};
